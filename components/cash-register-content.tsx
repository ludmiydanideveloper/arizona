"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/utils/supabase"

type Sale = {
  id: number
  total: number
  metodo_pago: "EFECTIVO" | "TARJETA"
  fecha: string
}

export default function CashRegisterContent() {
  const [sales, setSales] = useState<Sale[]>([])

  useEffect(() => {
    fetchSales()
  }, [])

  async function fetchSales() {
    const { data } = await supabase
      .from("ventas")
      .select("*")
      .order("fecha", { ascending: false })

    if (data) setSales(data)
  }

  const totalCash = sales
    .filter((v) => v.metodo_pago === "EFECTIVO")
    .reduce((acc, v) => acc + Number(v.total), 0)

  const totalCard = sales
    .filter((v) => v.metodo_pago === "TARJETA")
    .reduce((acc, v) => acc + Number(v.total), 0)

  const totalGeneral = totalCash + totalCard

  return (
    <div className="p-8 space-y-6 bg-gray-50 min-h-screen">
      {/* TOTALES */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <p className="text-sm text-gray-500 uppercase">Efectivo</p>
          <p className="text-2xl font-bold text-green-600">
            ${totalCash.toFixed(2)}
          </p>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <p className="text-sm text-gray-500 uppercase">Tarjeta</p>
          <p className="text-2xl font-bold text-blue-600">
            ${totalCard.toFixed(2)}
          </p>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <p className="text-sm text-gray-500 uppercase">Total General</p>
          <p className="text-2xl font-bold">
            ${totalGeneral.toFixed(2)}
          </p>
        </div>
      </div>

      {/* HISTORIAL */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h3 className="font-bold mb-4">Historial de Ventas</h3>

        <div className="max-h-96 overflow-y-auto">
          {sales.map((v) => (
            <div
              key={v.id}
              className="flex justify-between border-b py-2 text-sm"
            >
              <span>
                {new Date(v.fecha).toLocaleString()} -{" "}
                {v.metodo_pago}
              </span>
              <span className="font-bold">
                ${Number(v.total).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}