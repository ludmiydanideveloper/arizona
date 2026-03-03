"use client";

import { useState } from "react";
import {
  Banknote,
  CreditCard,
  DollarSign,
  Clock,
  XCircle,
} from "lucide-react";

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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import {
  getTotalSales,
  getTotalCash,
  getTotalCard,
  recentSales,
} from "@/lib/data";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function CashRegisterContent() {
  const [closed, setClosed] = useState(true);
  const [cajaAbierta, setCajaAbierta] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [mensajeVenta, setMensajeVenta] = useState("");

  // --- OBTENER USUARIO ---
  const obtenerUsuarioId = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id;
  };

  // --- CARRITO DE EJEMPLO ---
  const carrito = [
    { id: "1", name: "Producto A", precio: 100, costo: 60, cantidad: 2 },
    { id: "2", name: "Producto B", precio: 50, costo: 30, cantidad: 1 },
  ];

  // --- ABRIR CAJA ---
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
      const response = await fetch("/api/cajas/abrir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monto_inicial: 1000,
          usuario_id,
        }),
      });

      const data = await response.json();

      if (data.error) {
        setMensaje("Error: " + data.error);
      } else {
        setCajaAbierta(data.caja);
        setClosed(false);
        setMensaje("Caja abierta correctamente");
      }
    } catch (err) {
      setMensaje("Error al abrir caja");
    } finally {
      setLoading(false);
    }
  };

  // --- CREAR VENTA ---
  const crearVenta = async () => {
    if (!cajaAbierta) {
      setMensajeVenta("No hay caja abierta.");
      return;
    }

    setLoading(true);
    setMensajeVenta("");

    const usuario_id = await obtenerUsuarioId();
    if (!usuario_id) {
      setMensajeVenta("Usuario no logueado");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/ventas/crear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          carrito,
          vendedor_id: usuario_id,
          metodo_pago: "cash",
        }),
      });

      const data = await response.json();

      if (data.error) {
        setMensajeVenta("Error: " + data.error);
      } else {
        setMensajeVenta(
          `Venta registrada correctamente! Ticket: ${data.venta.ticket}`
        );
      }
    } catch (err) {
      setMensajeVenta("Error al registrar la venta.");
    } finally {
      setLoading(false);
    }
  };

  // --- CERRAR CAJA ---
  const cerrarCaja = () => {
    setCajaAbierta(null);
    setClosed(true);
    setMensaje("Caja cerrada");
  };

  return (
    <div className="flex flex-col gap-6">
      <Card
        className={
          closed
            ? "border-destructive/30 bg-destructive/5"
            : "border-accent/30 bg-accent/5"
        }
      >
        <CardContent className="flex items-center gap-3 p-4">
          <Clock
            className={
              closed ? "h-5 w-5 text-destructive" : "h-5 w-5 text-accent"
            }
          />
          <div>
            <p
              className={
                closed
                  ? "text-sm font-medium text-destructive"
                  : "text-sm font-medium text-accent"
              }
            >
              {closed ? "Cash register is closed" : "Cash register is open"}
            </p>
            <p className="text-xs text-muted-foreground">
              {closed
                ? "Closed at " + new Date().toLocaleTimeString()
                : "Today, " + new Date().toLocaleDateString()}
            </p>
          </div>
        </CardContent>
      </Card>

      {closed && !cajaAbierta && (
        <div>
          <Button onClick={abrirCaja} disabled={loading}>
            {loading ? "Abriendo..." : "Abrir Caja"}
          </Button>
          {mensaje && <p className="text-sm mt-2">{mensaje}</p>}
        </div>
      )}

      {cajaAbierta && !closed && (
        <div>
          <Button onClick={crearVenta} disabled={loading}>
            {loading ? "Registrando..." : "Crear Venta"}
          </Button>
          {mensajeVenta && <p className="text-sm mt-2">{mensajeVenta}</p>}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          title="Total Cash"
          value={`$${getTotalCash().toFixed(2)}`}
          icon={Banknote}
        />
        <SummaryCard
          title="Total Card"
          value={`$${getTotalCard().toFixed(2)}`}
          icon={CreditCard}
        />
        <SummaryCard
          title="Total General"
          value={`$${getTotalSales().toFixed(2)}`}
          icon={DollarSign}
        />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Today's Transactions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentSales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>{sale.id}</TableCell>
                  <TableCell>
                    {sale.date.split(" ")[1]}
                  </TableCell>
                  <TableCell>{sale.paymentMethod}</TableCell>
                  <TableCell>${sale.total.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={closed}>
              <XCircle className="h-4 w-4 mr-2" />
              Close Cash Register
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Close Cash Register?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Total today:{" "}
                <strong>${getTotalSales().toFixed(2)}</strong>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={cerrarCaja}>
                Confirm Close
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}