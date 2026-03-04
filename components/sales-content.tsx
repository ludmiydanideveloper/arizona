"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Product = {
  id: number
  nombre: string
  precio: number
  stock: number
}

type CartItem = Product & {
  quantity: number
}

export function SalesContent() {
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [paymentMethod, setPaymentMethod] = useState("EFECTIVO")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    const { data, error } = await supabase.from("productos").select("*")
    if (!error && data) setProducts(data)
  }

  function addToCart(product: Product) {
    if (product.stock <= 0) return

    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id)
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { ...product, quantity: 1 }]
    })
  }

  const total = cart.reduce((acc, item) => {
  const precio = parseFloat(item.precio as any) || 0
  const cantidad = parseFloat(item.quantity as any) || 0
  return acc + precio * cantidad
}, 0)

console.log("TOTAL CALCULADO:", total)
 async function completeSale() {
  if (cart.length === 0) {
    alert("Agregá productos al carrito");
    return;
  }

  console.log("METODO ENVIADO:", paymentMethod);
  setLoading(true);

  try {
    // 1️⃣ Insertar la venta
    const { data: venta, error: ventaError } = await supabase
      .from("ventas")
      .insert([
        {
          total: total,
          metodo_pago: paymentMethod,
          fecha: new Date(), // opcional: fecha actual
        },
      ])
      .select()
      .single();

    if (ventaError || !venta) throw ventaError;

    // 2️⃣ Crear detalles con precio correcto según método de pago
    const detalles = cart.map((item) => {
      const precio =
        paymentMethod === "efectivo"
          ? Number(item.precio_efectivo) || 0
          : Number(item.precio_tarjeta) || 0;

      return {
        venta_id: venta.id,
        producto_id: item.id,
        cantidad: item.quantity,
        precio,
      };
    });

    console.log("DETALLES A INSERTAR:", detalles);

    // 3️⃣ Insertar detalles en la base
    const { error: detalleError } = await supabase
      .from("detalle_ventas")
      .insert(detalles);

    if (detalleError) throw detalleError;

    // 4️⃣ Actualizar stock de cada producto
    for (const item of cart) {
      const { error: stockError } = await supabase
        .from("productos")
        .update({
          stock: item.stock - item.quantity,
        })
        .eq("id", item.id);

      if (stockError) throw stockError;
    }

    alert("Venta guardada correctamente ✅");

    // Limpiar carrito y recargar productos
    setCart([]);
    fetchProducts();
  } catch (error) {
    console.error("Error completando venta:", error);
    alert("Error al guardar la venta");
  }

  setLoading(false);
}

  return (
    <div className="p-6 flex gap-10">

      {/* PRODUCTOS */}
      <div className="flex-1">
        <h2 className="text-xl font-bold mb-4">Productos</h2>
        <div className="grid grid-cols-2 gap-4">
          {products.map((product) => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              className="border p-3 rounded hover:bg-gray-100"
            >
              <p className="font-semibold">{product.nombre}</p>
              <p>${product.precio}</p>
              <p className="text-sm text-gray-500">
                Stock: {product.stock}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* CARRITO */}
      <div className="w-96">
        <h2 className="text-xl font-bold mb-4">Carrito</h2>

        {cart.map((item) => (
          <div key={item.id} className="flex justify-between mb-2">
            <span>
              {item.nombre} x {item.quantity}
            </span>
            <span>${item.precio * item.quantity}</span>
          </div>
        ))}

        <hr className="my-4" />

        <p className="font-bold mb-4">Total: ${total}</p>

        <select
          className="w-full mb-4 border p-2"
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
        >
         <option value="EFECTIVO">Efectivo</option>
<option value="TARJETA">Tarjeta</option>
        </select>

        <button
          onClick={completeSale}
          disabled={loading}
          className="w-full bg-black text-white p-3 rounded"
        >
          {loading ? "Guardando..." : "Complete Sale"}
        </button>
      </div>
    </div>
  )
}