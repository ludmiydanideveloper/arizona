"use client";

import { useEffect, useState } from "react";
import { Banknote, CreditCard, DollarSign, XCircle } from "lucide-react";

import { createClient } from "@supabase/supabase-js";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SummaryCard } from "@/components/summary-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function CashRegisterContent() {
  const [closed, setClosed] = useState(true);
  const [cajaAbierta, setCajaAbierta] = useState<any>(null);
  const [ventas, setVentas] = useState<any[]>([]);
  const [totalGeneral, setTotalGeneral] = useState(0);
  const [totalCash, setTotalCash] = useState(0);
  const [totalCard, setTotalCard] = useState(0);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");

  // ---------------- VERIFICAR CAJA AL INICIAR ----------------
  useEffect(() => {
    const verificarCaja = async () => {
      const { data } = await supabase
        .from("cajas")
        .select("*")
        .eq("estado", "abierta")
        .maybeSingle();

      if (data) {
        setCajaAbierta(data);
        setClosed(false);
        cargarVentas(data.id);
      } else {
        setClosed(true);
        setCajaAbierta(null);
      }
    };

    verificarCaja();
  }, []);

  // ---------------- OBTENER USUARIO ----------------
  const obtenerUsuarioId = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id;
  };

  // ---------------- CARGAR VENTAS EXISTENTES ----------------
  const cargarVentas = async (cajaId: string) => {
    const { data, error } = await supabase
      .from("ventas")
      .select("*")
      .eq("caja_id", cajaId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setVentas(data);

      const total = data.reduce((acc, v) => acc + Number(v.total), 0);
      const cash = data
        .filter((v) => v.metodo_pago === "cash")
        .reduce((acc, v) => acc + Number(v.total), 0);
      const card = data
        .filter((v) => v.metodo_pago === "card")
        .reduce((acc, v) => acc + Number(v.total), 0);

      setTotalGeneral(total);
      setTotalCash(cash);
      setTotalCard(card);
    }
  };

  // ---------------- TIEMPO REAL ----------------
  useEffect(() => {
    if (!cajaAbierta) return;

    cargarVentas(cajaAbierta.id);

    const channel = supabase
      .channel("ventas-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ventas",
          filter: `caja_id=eq.${cajaAbierta.id}`,
        },
        () => {
          cargarVentas(cajaAbierta.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [cajaAbierta]);

  // ---------------- ABRIR CAJA ----------------
  const abrirCaja = async () => {
    setLoading(true);
    setMensaje("");

    const usuario_id = await obtenerUsuarioId();
    if (!usuario_id) {
      setMensaje("Usuario no logueado");
      setLoading(false);
      return;
    }

    try {
      // Verifico si ya hay caja abierta
      const { data: cajaExistente } = await supabase
        .from("cajas")
        .select("*")
        .eq("estado", "abierta")
        .maybeSingle();

      if (cajaExistente) {
        setCajaAbierta(cajaExistente);
        setClosed(false);
        cargarVentas(cajaExistente.id);
        setMensaje("Caja ya estaba abierta");
        setLoading(false);
        return;
      }

      // Creo nueva caja
      const { data, error } = await supabase
        .from("cajas")
        .insert({
          estado: "abierta",
          monto_inicial: 0,
          usuario_id,
        })
        .select()
        .single();

      if (error) {
        setMensaje("Error: " + error.message);
      } else {
        setCajaAbierta(data);
        setClosed(false);
        setVentas([]); // inicializo totales en 0
        setTotalGeneral(0);
        setTotalCash(0);
        setTotalCard(0);
        setMensaje("Caja abierta correctamente");
      }
    } catch {
      setMensaje("Error al abrir caja");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- CERRAR CAJA ----------------
  const cerrarCaja = async () => {
    if (!cajaAbierta) return;

    await supabase
      .from("cajas")
      .update({ estado: "cerrada" })
      .eq("id", cajaAbierta.id);

    setCajaAbierta(null);
    setClosed(true);
    setVentas([]);
    setTotalGeneral(0);
    setTotalCash(0);
    setTotalCard(0);

    setMensaje("Caja cerrada correctamente");
  };

  // ---------------- RENDER ----------------
  return (
    <div className="flex flex-col gap-6">
      {/* BOTÓN ABRIR CAJA */}
      {closed && (
        <Button onClick={abrirCaja} disabled={loading}>
          {loading ? "Abriendo..." : "Abrir Caja"}
        </Button>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mt-4">
        <SummaryCard
          title="Total Cash"
          value={`$${totalCash.toFixed(2)}`}
          icon={Banknote}
        />
        <SummaryCard
          title="Total Card"
          value={`$${totalCard.toFixed(2)}`}
          icon={CreditCard}
        />
        <SummaryCard
          title="Total General"
          value={`$${Number(totalGeneral || 0).toFixed(2)}}`}
          icon={DollarSign}
        />
      </div>

      {/* TABLA DE VENTAS */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ventas.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>{sale.id}</TableCell>
                  <TableCell>
                    {sale.created_at
                      ? new Date(sale.created_at).toLocaleTimeString()
                      : "-"}
                  </TableCell>
                  <TableCell>{sale.metodo_pago}</TableCell>
                  <TableCell>${Number(sale.total).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* BOTÓN CERRAR CAJA */}
      {!closed && (
        <div className="flex justify-end">
          <Button variant="destructive" onClick={cerrarCaja}>
            <XCircle className="h-4 w-4 mr-2" />
            Close Cash Register
          </Button>
        </div>
      )}

      {/* MENSAJE */}
      {mensaje && <p className="text-sm text-gray-600 mt-2">{mensaje}</p>}
    </div>
  );
}