"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/utils/supabase"

type PaymentMethod = "EFECTIVO" | "TARJETA"

type Product = {
  id: number
  nombre: string
  stock: number
  precio_costo: number
  precio_efectivo: number
  precio_tarjeta: number
  codigo_barras?: string
}

type CartItem = Product & {
  quantity: number
}

export function SalesContent() {
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("EFECTIVO")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    const { data } = await supabase.from("productos").select("*")
    if (data) setProducts(data)
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
    const precio =
      paymentMethod === "EFECTIVO"
        ? Number(item.precio_efectivo)
        : Number(item.precio_tarjeta)

    return acc + precio * item.quantity
  }, 0)

  async function completeSale() {
    if (cart.length === 0) {
      alert("AGREGÁ PRODUCTOS")
      return
    }

    setLoading(true)

    try {
      // 1️⃣ Insertar venta
      const { data: venta, error: ventaError } = await supabase
        .from("ventas")
        .insert({
          total,
          metodo_pago: paymentMethod,
          fecha: new Date().toISOString(),
        })
        .select()
        .single()

      if (ventaError || !venta) throw ventaError

      // 2️⃣ Insertar detalles
      const detalles = cart.map((item) => {
        const precio =
          paymentMethod === "EFECTIVO"
            ? Number(item.precio_efectivo)
            : Number(item.precio_tarjeta)

        return {
          venta_id: venta.id,
          producto_id: item.id,
          cantidad: item.quantity,
          precio,
        }
      })

      const { error: detalleError } = await supabase
        .from("detalle_ventas")
        .insert(detalles)

      if (detalleError) throw detalleError

      // 3️⃣ Actualizar stock
      for (const item of cart) {
        const nuevoStock = item.stock - item.quantity

        const { error } = await supabase
          .from("productos")
          .update({ stock: nuevoStock })
          .eq("id", item.id)

        if (error) throw error
      }

      alert("VENTA REGISTRADA ✅")

      setCart([])
      fetchProducts()
    } catch (error: any) {
      console.error(error)
      alert("ERROR AL GUARDAR VENTA")
    } finally {
      setLoading(false)
    }
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
              <p>
                $
                {paymentMethod === "EFECTIVO"
                  ? product.precio_efectivo
                  : product.precio_tarjeta}
              </p>
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

        {cart.map((item) => {
          const precio =
            paymentMethod === "EFECTIVO"
              ? item.precio_efectivo
              : item.precio_tarjeta

          return (
            <div key={item.id} className="flex justify-between mb-2">
              <span>
                {item.nombre} x {item.quantity}
              </span>
              <span>${precio * item.quantity}</span>
            </div>
          )
        })}

        <hr className="my-4" />

        <p className="font-bold mb-4">Total: ${total}</p>

        <select
          className="w-full mb-4 border p-2"
          value={paymentMethod}
          onChange={(e) =>
            setPaymentMethod(e.target.value as PaymentMethod)
          }
        >
          <option value="EFECTIVO">EFECTIVO</option>
          <option value="TARJETA">TARJETA</option>
        </select>

        <button
          onClick={completeSale}
          disabled={loading}
          className="w-full bg-black text-white p-3 rounded"
        >
          {loading ? "PROCESANDO..." : "CONFIRMAR VENTA"}
        </button>
      </div>
    </div>
  )
}