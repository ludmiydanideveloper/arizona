"use client";

import { useEffect, useState } from "react";
import { Banknote, CreditCard, DollarSign } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";

import { SummaryCard } from "@/components/summary-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function CashRegisterContent() {
  const [caja, setCaja] = useState<any>(null);
  const [ventas, setVentas] = useState<any[]>([]);
  const [totalGeneral, setTotalGeneral] = useState(0);
  const [totalCash, setTotalCash] = useState(0);
  const [totalCard, setTotalCard] = useState(0);
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);

  // ---------------- OBTENER USUARIO ----------------
  const obtenerUsuarioId = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id;
  };

  // ---------------- INICIALIZAR CAJA AUTOMÁTICA ----------------
  useEffect(() => {
    const initCaja = async () => {
      const usuario_id = await obtenerUsuarioId();
      if (!usuario_id) return;

      const { data: cajaExistente } = await supabase
        .from("cajas")
        .select("*")
        .eq("estado", "abierta")
        .maybeSingle();

      if (cajaExistente) {
        setCaja(cajaExistente);
        cargarVentas(cajaExistente.id);
      } else {
        const { data } = await supabase
          .from("cajas")
          .insert({
            estado: "abierta",
            monto_inicial: 0,
            usuario_id,
          })
          .select()
          .single();

        setCaja(data);
        setVentas([]);
        setTotalGeneral(0);
        setTotalCash(0);
        setTotalCard(0);
      }
    };

    initCaja();
  }, []);

  // ---------------- CARGAR VENTAS ----------------
  const cargarVentas = async (cajaId: string) => {
    const { data } = await supabase
      .from("ventas")
      .select("*")
      .eq("caja_id", cajaId)
      .order("fecha", { ascending: false });

    if (data) {
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

  // ---------------- CARRITO DINÁMICO ----------------
  const [carrito, setCarrito] = useState<
    { producto_id: string; nombre: string; cantidad: number; precio: number }[]
  >([]);

  const agregarProductoPorCodigo = async (codigo: string) => {
    // Buscar producto por código de barras
    const { data, error } = await supabase
      .from("productos")
      .select("*")
      .eq("codigo_barras", codigo)
      .maybeSingle();

    if (error || !data) {
      setMensaje("Producto no encontrado");
      return;
    }

    // Verificar si ya está en el carrito
    const index = carrito.findIndex((p) => p.producto_id === data.id);
    let nuevoCarrito = [...carrito];

    if (index >= 0) {
      // Incrementar cantidad
      nuevoCarrito[index].cantidad += 1;
    } else {
      nuevoCarrito.push({
        producto_id: data.id,
        nombre: data.nombre,
        cantidad: 1,
        precio: Number(data.precio_efectivo),
      });
    }

    setCarrito(nuevoCarrito);
    setMensaje("");
  };

  // ---------------- REGISTRAR VENTA ----------------
  const registrarVenta = async () => {
    if (!caja) {
      setMensaje("Caja no inicializada");
      return;
    }

    if (carrito.length === 0) {
      setMensaje("El carrito está vacío");
      return;
    }

    setLoading(true);
    setMensaje("");

    const usuario_id = await obtenerUsuarioId();
    if (!usuario_id) {
      setMensaje("Usuario no logueado");
      setLoading(false);
      return;
    }

    try {
      const ventaId = uuidv4();
      const total = carrito.reduce((acc, i) => acc + i.precio * i.cantidad, 0);

      // Insert en ventas
      const { error: errorVenta } = await supabase.from("ventas").insert({
        id: ventaId,
        caja_id: caja.id,
        vendedor: usuario_id,
        fecha: new Date().toISOString(),
        total,
        ganancia: 0,
        metodo_pago: "cash",
        ticket: "TICKET001",
      });

      if (errorVenta) throw errorVenta;

      // Insert en detalle_ventas
      const detalle = carrito.map((item) => ({
        venta_id: ventaId,
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        precio: item.precio,
      }));

      const { error: errorDetalle } = await supabase.from("detalle_ventas").insert(detalle);
      if (errorDetalle) throw errorDetalle;

      // Trigger de la DB descuenta stock automáticamente
      cargarVentas(caja.id);
      setCarrito([]); // vaciar carrito después de la venta
      setMensaje("Venta registrada correctamente!");
    } catch (err: any) {
      setMensaje("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- RENDER ----------------
  return (
    <div className="flex flex-col gap-6">
      {/* Input para escanear código de barras */}
      <input
        type="text"
        placeholder="Escanear código de barras"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            agregarProductoPorCodigo((e.target as HTMLInputElement).value);
            (e.target as HTMLInputElement).value = "";
          }
        }}
        className="border p-2 rounded"
      />

      <Button onClick={registrarVenta} disabled={loading || carrito.length === 0}>
        {loading ? "Registrando..." : "Registrar Venta"}
      </Button>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mt-4">
        <SummaryCard title="Total Cash" value={`$${totalCash.toFixed(2)}`} icon={Banknote} />
        <SummaryCard title="Total Card" value={`$${totalCard.toFixed(2)}`} icon={CreditCard} />
        <SummaryCard title="Total General" value={`$${Number(totalGeneral || 0).toFixed(2)}}`} icon={DollarSign} />
      </div>

      {/* Tabla de carrito */}
      <Card>
        <CardHeader>
          <CardTitle>Carrito</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Precio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {carrito.map((item) => (
                <TableRow key={item.producto_id}>
                  <TableCell>{item.nombre}</TableCell>
                  <TableCell>{item.cantidad}</TableCell>
                  <TableCell>${item.precio.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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
                  <TableCell>{sale.fecha ? new Date(sale.fecha).toLocaleTimeString() : "-"}</TableCell>
                  <TableCell>{sale.metodo_pago}</TableCell>
                  <TableCell>${Number(sale.total).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {mensaje && <p className="text-sm text-gray-600 mt-2">{mensaje}</p>}
    </div>
  );
}