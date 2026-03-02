import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const { caja_id } = await req.json()
    if (!caja_id) return NextResponse.json({ error: "Falta caja_id" }, { status: 400 })

    const { data, error } = await supabase.rpc("cerrar_caja", { p_caja_id: caja_id })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true, data })
  } catch (err) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}