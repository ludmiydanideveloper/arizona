"use client";

import { useEffect, useState, useRef } from "react";
import { Banknote, CreditCard, DollarSign, Plus, Minus, Trash2, ShoppingCart } from "lucide-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { v4 as uuidv4 } from "uuid";

import { SummaryCard } from "@/components/summary-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner"; // Opcional, si no lo tienes usa alert

export function CashRegisterContent() {
  const supabase = createClientComponentClient();
  const [caja, setCaja] = useState<any>(null);
  const [ventas, setVentas] = useState<any[]>([]);
  const [totalGeneral, setTotalGeneral] = useState(0);
  const [totalCash, setTotalCash] = useState(0);
  const [totalCard, setTotalCard] = useState(0);
  const [loading, setLoading] = useState(false);
  const [metodoPago, setMetodoPago] = useState<"cash" | "card">("cash");

  const [carrito, setCarrito] = useState<any[]>([]);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // 1. INICIALIZAR CAJA (Sin tocar tu flujo automático)
  useEffect(() => {
    const initCaja = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: cajaExistente } = await supabase
        .from("cajas")
        .select("*")
        .eq("estado", "abierta")
        .maybeSingle();

      if (cajaExistente) {
        setCaja(cajaExistente);
        cargarVentas(cajaExistente.id);
      } else {
        const { data: nuevaCaja } = await supabase
          .from("cajas")
          .insert({
            estado: "abierta",
            monto_inicial: 0,
            usuario_id: user.id,
          })
          .select()
          .single();
        if (nuevaCaja) {
          setCaja(nuevaCaja);
          cargarVentas(nuevaCaja.id);
        }
      }
    };
    initCaja();
  }, []);

  // 2. CARGAR VENTAS Y TOTALES REALES
  const cargarVentas = async (cajaId: string) => {
    const { data, error } = await supabase
      .from("ventas")
      .select("*")
      .eq("caja_id", cajaId)
      .order("created_at", { ascending: false });

    if (data) {
      setVentas(data);
      const total = data.reduce((acc, v) => acc + Number(v.total), 0);
      const cash = data.filter((v) => v.metodo_pago === "cash").reduce((acc, v) => acc + Number(v.total), 0);
      const card = data.filter((v) => v.metodo_pago === "card").reduce((acc, v) => acc + Number(v.total), 0);

      setTotalGeneral(total);
      setTotalCash(cash);
      setTotalCard(card);
    }
  };

  // 3. CARRITO: AGREGAR Y MODIFICAR (Cálculo real de subtotal)
  const agregarProductoPorCodigo = async (codigo: string) => {
    const { data: producto, error } = await supabase
      .from("productos")
      .select("*")
      .eq("codigo_barras", codigo)
      .maybeSingle();

    if (error || !producto) {
      toast.error("Producto no encontrado");
      return;
    }

    setCarrito((prev) => {
      const existe = prev.find((p) => p.producto_id === producto.id);
      if (existe) {
        return prev.map((p) =>
          p.producto_id === producto.id ? { ...p, cantidad: p.cantidad + 1 } : p
        );
      }
      return [
        ...prev,
        {
          producto_id: producto.id,
          nombre: producto.nombre,
          cantidad: 1,
          precio_costo: producto.precio_costo,
          precio_unitario: Number(producto.precio_efectivo), // Precio base
          stock_disponible: producto.stock
        },
      ];
    });
  };

  const actualizarCantidad = (id: string, delta: number) => {
    setCarrito((prev) =>
      prev.map((item) => {
        if (item.producto_id === id) {
          const nuevaCant = Math.max(1, Math.min(item.cantidad + delta, item.stock_disponible));
          return { ...item, cantidad: nuevaCant };
        }
        return item;
      })
    );
  };

  const eliminarDelCarrito = (id: string) => {
    setCarrito((prev) => prev.filter((item) => item.producto_id !== id));
  };

  const totalCarrito = carrito.reduce((acc, i) => acc + i.precio_unitario * i.cantidad, 0);

  // 4. REGISTRAR VENTA (Atómico y con ganancia real)
  const registrarVenta = async () => {
    if (!caja || carrito.length === 0) return;
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const ventaId = uuidv4();
      
      // Cálculo de ganancia real (Precio Venta - Precio Costo)
      const gananciaTotal = carrito.reduce((acc, i) => 
        acc + (i.precio_unitario - i.precio_costo) * i.cantidad, 0
      );

      // Insert Venta
      const { error: errorVenta } = await supabase.from("ventas").insert({
        id: ventaId,
        caja_id: caja.id,
        vendedor: user?.id,
        total: totalCarrito,
        ganancia: gananciaTotal,
        metodo_pago: metodoPago,
        fecha: new Date().toISOString(),
      });

      if (errorVenta) throw errorVenta;

      // Insert Detalles (Esto dispara el trigger de stock en la DB)
      const detalles = carrito.map((item) => ({
        venta_id: ventaId,
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        precio: item.precio_unitario,
      }));

      const { error: errorDetalle } = await supabase.from("detalle_ventas").insert(detalles);
      if (errorDetalle) throw errorDetalle;

      toast.success("Venta completada");
      setCarrito([]);
      cargarVentas(caja.id);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
      barcodeInputRef.current?.focus();
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4">
      {/* Resumen Superior */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard title="Efectivo Hoy" value={`$${totalCash.toLocaleString()}`} icon={Banknote} />
        <SummaryCard title="Tarjeta Hoy" value={`$${totalCard.toLocaleString()}`} icon={CreditCard} />
        <SummaryCard title="Total General" value={`$${totalGeneral.toLocaleString()}`} icon={DollarSign} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lado Izquierdo: Carrito */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><ShoppingCart /> Carrito</CardTitle>
            <input
              ref={barcodeInputRef}
              type="text"
              placeholder="Escanear producto..."
              className="border p-2 rounded w-1/2"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  agregarProductoPorCodigo(e.currentTarget.value);
                  e.currentTarget.value = "";
                }
              }}
              autoFocus
            />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-center">Cant.</TableHead>
                  <TableHead>Subtotal</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {carrito.map((item) => (
                  <TableRow key={item.producto_id}>
                    <TableCell className="font-medium">{item.nombre}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => actualizarCantidad(item.producto_id, -1)}><Minus size={14}/></Button>
                        <span className="w-4 text-center">{item.cantidad}</span>
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => actualizarCantidad(item.producto_id, 1)}><Plus size={14}/></Button>
                      </div>
                    </TableCell>
                    <TableCell>${(item.precio_unitario * item.cantidad).toLocaleString()}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => eliminarDelCarrito(item.producto_id)}><Trash2 size={16} className="text-red-500"/></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Lado Derecho: Pago */}
        <Card>
          <CardHeader><CardTitle>Finalizar Venta</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-2">
              <Button 
                className="flex-1" 
                variant={metodoPago === "cash" ? "default" : "outline"}
                onClick={() => setMetodoPago("cash")}
              >Efectivo</Button>
              <Button 
                className="flex-1" 
                variant={metodoPago === "card" ? "default" : "outline"}
                onClick={() => setMetodoPago("card")}
              >Tarjeta</Button>
            </div>
            
            <div className="text-center py-4 bg-gray-100 rounded-lg">
              <p className="text-sm text-gray-500 uppercase font-bold">Total a Cobrar</p>
              <p className="text-4xl font-black">${totalCarrito.toLocaleString()}</p>
            </div>

            <Button 
              className="w-full h-16 text-xl" 
              disabled={loading || carrito.length === 0}
              onClick={registrarVenta}
            >
              {loading ? "Procesando..." : "REGISTRAR VENTA"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Historial rápido */}
      <Card>
        <CardHeader><CardTitle>Últimas Ventas</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hora</TableHead>
                <TableHead>Método</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ventas.slice(0, 5).map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>{new Date(sale.fecha).toLocaleTimeString()}</TableCell>
                  <TableCell className="capitalize">{sale.metodo_pago}</TableCell>
                  <TableCell className="text-right font-bold">${Number(sale.total).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}