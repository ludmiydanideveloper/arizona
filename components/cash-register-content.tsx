"use client";

import { useState } from "react";
import {
  Banknote,
  CreditCard,
  DollarSign,
  Clock,
  XCircle,
} from "lucide-react";
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

import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export function CashRegisterContent() {
  // --- ESTADOS ---
  const [closed, setClosed] = useState(true); // la caja empieza cerrada
  const [cajaAbierta, setCajaAbierta] = useState<any>(null); // info de la caja abierta
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [mensajeVenta, setMensajeVenta] = useState("");

  const supabase = createClientComponentClient();

  // --- FUNCION PARA OBTENER USUARIO LOGUEADO ---
  const obtenerUsuarioId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id;
  };

  // --- EJEMPLO DE CARRITO ---
  // Esto sería dinámico según tu app
  const carrito = [
    { id: "1", name: "Producto A", precio: 100, costo: 60, cantidad: 2 },
    { id: "2", name: "Producto B", precio: 50, costo: 30, cantidad: 1 },
  ];

  // --- FUNCION ABRIR CAJA ---
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
          usuario_id: usuario_id,
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

  // --- FUNCION CREAR VENTA ---
  const crearVenta = async () => {
    if (!cajaAbierta) {
      setMensajeVenta("No hay caja abierta para registrar la venta.");
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
          metodo_pago: "cash", // ejemplo, puede ser dinámico
        }),
      });

      const data = await response.json();

      if (data.error) {
        setMensajeVenta("Error: " + data.error);
      } else {
        setMensajeVenta(`Venta registrada correctamente! Ticket: ${data.venta.ticket}`);
        // Aquí podrías limpiar el carrito si querés
      }
    } catch (err) {
      setMensajeVenta("Error al registrar la venta.");
    } finally {
      setLoading(false);
    }
  };

  // --- FUNCION CERRAR CAJA ---
  const cerrarCaja = () => {
    setCajaAbierta(null);
    setClosed(true);
    setMensaje("Caja cerrada");
    // Aquí deberías llamar a tu endpoint /api/cajas/cerrar si lo tenés
  };

  return (
    <div className="flex flex-col gap-6">
      {/* --- STATUS DE LA CAJA --- */}
      <Card className={closed ? "border-destructive/30 bg-destructive/5" : "border-accent/30 bg-accent/5"}>
        <CardContent className="flex items-center gap-3 p-4">
          <Clock className={closed ? "h-5 w-5 text-destructive" : "h-5 w-5 text-accent"} />
          <div>
            <p className={closed ? "text-sm font-medium text-destructive" : "text-sm font-medium text-accent"}>
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

      {/* --- BOTON ABRIR CAJA --- */}
      {closed && !cajaAbierta && (
        <div>
          <Button
            className="bg-blue-600 text-white px-4 py-2 rounded w-full sm:w-auto"
            onClick={abrirCaja}
            disabled={loading}
          >
            {loading ? "Abriendo..." : "Abrir Caja"}
          </Button>
          {mensaje && <p className="text-sm mt-2">{mensaje}</p>}
        </div>
      )}

      {/* --- BOTON CREAR VENTA --- */}
      {cajaAbierta && !closed && (
        <div>
          <Button
            className="bg-green-600 text-white px-4 py-2 rounded w-full sm:w-auto"
            onClick={crearVenta}
            disabled={loading}
          >
            {loading ? "Registrando..." : "Crear Venta"}
          </Button>
          {mensajeVenta && <p className="text-sm mt-2">{mensajeVenta}</p>}
        </div>
      )}

      {/* --- SUMMARY CARDS --- */}
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

      {/* --- TABLA DE TRANSACCIONES --- */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-card-foreground">{"Today's Transactions"}</CardTitle>
            <span className="text-sm text-muted-foreground">{recentSales.length} transactions</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead className="hidden sm:table-cell">Items</TableHead>
                  <TableHead className="text-center">Method</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{sale.id}</TableCell>
                    <TableCell className="text-card-foreground text-sm">{sale.date.split(" ")[1]}</TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground max-w-[200px] truncate">
                      {sale.items.map((i) => i.name).join(", ")}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground capitalize">
                        {sale.paymentMethod === "cash" ? (
                          <Banknote className="h-3 w-3" />
                        ) : (
                          <CreditCard className="h-3 w-3" />
                        )}
                        {sale.paymentMethod}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium text-card-foreground">${sale.total.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* --- BOTON CERRAR CAJA --- */}
      <div className="flex justify-end">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="gap-2" disabled={closed}>
              <XCircle className="h-4 w-4" />
              Close Cash Register
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Close Cash Register?</AlertDialogTitle>
              <AlertDialogDescription>
                This will close the cash register for today. Make sure all
                transactions have been recorded. Total for today:{" "}
                <strong>${getTotalSales().toFixed(2)}</strong>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={cerrarCaja}>Confirm Close</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}