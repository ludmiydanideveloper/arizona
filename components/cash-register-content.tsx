"use client";

import { useEffect, useState, useRef } from "react";
import { Banknote, CreditCard, DollarSign, ShoppingCart, Trash2 } from "lucide-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function CashRegisterContent() {
  const supabase = createClientComponentClient();
  
  // Estados de Datos
  const [caja, setCaja] = useState<any>(null);
  const [ventas, setVentas] = useState<any[]>([]);
  const [carrito, setCarrito] = useState<any[]>([]);
  
  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [metodoPago, setMetodoPago] = useState<"cash" | "card">("cash");
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // 1. CARGAR TODO AL INICIO
  useEffect(() => {
    const cargarTodo = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar caja abierta
      const { data: cajaExistente } = await supabase
        .from("cajas")
        .select("*")
        .eq("estado", "abierta")
        .maybeSingle();

      if (cajaExistente) {
        setCaja(cajaExistente);
        const { data: listaVentas } = await supabase
          .from("ventas")
          .select("*")
          .eq("caja_id", cajaExistente.id)
          .order("created_at", { ascending: false });
        
        if (listaVentas) setVentas(listaVentas);
      }
    };
    cargarTodo();
  }, []);

  // 2. TOTALES CALCULADOS (Esto no falla si los datos existen)
  const totalCash = ventas
    .filter(v => v.metodo_pago === "cash")
    .reduce((acc, v) => acc + Number(v.total || 0), 0);

  const totalCard = ventas
    .filter(v => v.metodo_pago === "card")
    .reduce((acc, v) => acc + Number(v.total || 0), 0);

  const totalGeneral = totalCash + totalCard;

  const totalCarrito = carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);

  // 3. AGREGAR AL CARRITO
  const agregarAlCarrito = async (codigo: string) => {
    const { data: producto, error } = await supabase
      .from("productos")
      .select("*")
      .eq("codigo_barras", codigo)
      .single();

    if (error || !producto) return alert("Producto no encontrado");

    setCarrito(prev => {
      const existe = prev.find(p => p.id === producto.id);
      if (existe) {
        return prev.map(p => p.id === producto.id ? { ...p, cantidad: p.cantidad + 1 } : p);
      }
      return [...prev, { 
        id: producto.id, 
        nombre: producto.nombre, 
        precio: Number(producto.precio_efectivo), 
        cantidad: 1 
      }];
    });
  };

  // 4. REGISTRAR VENTA
  const registrarVenta = async () => {
    if (!caja || carrito.length === 0) return;
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Insertar Venta
      const { data: nuevaVenta, error: errV } = await supabase
        .from("ventas")
        .insert({
          caja_id: caja.id,
          vendedor: user?.id,
          total: totalCarrito,
          metodo_pago: metodoPago,
          fecha: new Date().toISOString()
        })
        .select()
        .single();

      if (errV) throw errV;

      // Insertar Detalles
      const detalles = carrito.map(i => ({
        venta_id: nuevaVenta.id,
        producto_id: i.id,
        cantidad: i.cantidad,
        precio: i.precio
      }));

      const { error: errD } = await supabase.from("detalle_ventas").insert(detalles);
      if (errD) throw errD;

      // Refrescar Historial y Limpiar
      const { data: refresh } = await supabase
        .from("ventas")
        .select("*")
        .eq("caja_id", caja.id)
        .order("created_at", { ascending: false });
      
      setVentas(refresh || []);
      setCarrito([]);
      alert("Venta exitosa");

    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-6 bg-gray-50 min-h-screen font-sans">
      {/* HEADER TOTALES */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <p className="text-sm text-gray-500 uppercase">Efectivo</p>
          <p className="text-2xl font-bold text-green-600">${totalCash.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <p className="text-sm text-gray-500 uppercase">Tarjeta</p>
          <p className="text-2xl font-bold text-blue-600">${totalCard.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <p className="text-sm text-gray-500 uppercase">Total General</p>
          <p className="text-2xl font-bold text-black">${totalGeneral.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* CARRITO */}
        <div className="col-span-2 bg-white p-6 rounded-xl shadow-lg">
          <input
            ref={barcodeInputRef}
            className="w-full p-3 border-2 border-blue-200 rounded-lg mb-4"
            placeholder="Escaneá el código de barras y dale Enter..."
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                agregarAlCarrito(e.currentTarget.value);
                e.currentTarget.value = "";
              }
            }}
          />
          <table className="w-full text-left">
            <thead>
              <tr className="border-b text-gray-400 uppercase text-xs">
                <th className="py-2">Producto</th>
                <th className="py-2">Cant</th>
                <th className="py-2">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {carrito.map(item => (
                <tr key={item.id} className="border-b">
                  <td className="py-3 font-bold">{item.nombre}</td>
                  <td className="py-3">{item.cantidad}</td>
                  <td className="py-3">${(item.precio * item.cantidad).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PAGO */}
        <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-bold mb-4">Finalizar</h2>
            <div className="flex gap-2 mb-4">
              <button 
                onClick={() => setMetodoPago("cash")}
                className={`flex-1 p-2 rounded ${metodoPago === "cash" ? 'bg-green-600 text-white' : 'bg-gray-100'}`}
              >Efectivo</button>
              <button 
                onClick={() => setMetodoPago("card")}
                className={`flex-1 p-2 rounded ${metodoPago === "card" ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
              >Tarjeta</button>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded">
              <p className="text-4xl font-black">${totalCarrito.toFixed(2)}</p>
            </div>
          </div>
          <button 
            disabled={loading || carrito.length === 0}
            onClick={registrarVenta}
            className="w-full bg-black text-white p-4 rounded-xl font-bold mt-4 hover:bg-gray-800"
          >
            {loading ? "PROCESANDO..." : "REGISTRAR VENTA"}
          </button>
        </div>
      </div>

      {/* HISTORIAL */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h3 className="font-bold mb-4">Ventas de la Caja Actual</h3>
        <div className="max-h-64 overflow-y-auto">
          {ventas.map(v => (
            <div key={v.id} className="flex justify-between border-b py-2 text-sm">
              <span>{new Date(v.fecha).toLocaleTimeString()} - {v.metodo_pago}</span>
              <span className="font-bold">${Number(v.total).toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}