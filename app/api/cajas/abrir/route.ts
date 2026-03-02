import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { usuario_id, monto_apertura } = body

    if (!usuario_id || !monto_apertura) {
      return NextResponse.json(
        { error: "Faltan datos" },
        { status: 400 }
      )
    }

    // Verificar si ya hay caja abierta
    const { data: cajaAbierta } = await supabase
      .from("cajas")
      .select("*")
      .eq("estado", "abierta")
      .single()

    if (cajaAbierta) {
      return NextResponse.json(
        { error: "Ya existe una caja abierta" },
        { status: 400 }
      )
    }

    // Crear nueva caja
    const { data, error } = await supabase
      .from("cajas")
      .insert([
        {
          fecha: new Date(),
          monto_apertura,
          total_ventas: 0,
          estado: "abierta",
          usuario_id,
        },
      ])
      .select()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ caja: data[0] })

  } catch (err) {
    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 }
    )
  }
}