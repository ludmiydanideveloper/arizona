import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const { vendedor, metodo_pago, total, ganancia, ticket } = await req.json()

    // Buscar caja abierta
    const { data: caja } = await supabase
      .from("cajas")
      .select("*")
      .eq("estado", "abierta")
      .single()

    if (!caja) return NextResponse.json({ error: "No hay caja abierta" }, { status: 400 })

    const { data, error } = await supabase
      .from("ventas")
      .insert([{
        vendedor,
        metodo_pago,
        total,
        ganancia,
        ticket,
        caja_id: caja.id,
        fecha: new Date()
      }])
      .select()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ venta: data[0] })
  } catch (err) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}