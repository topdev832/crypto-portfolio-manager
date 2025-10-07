/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const sb = createClient(url, serviceKey)

export async function POST(req: Request): Promise<Response> {
  try {
    const body = (await req.json()) as { rows?: any[] }
    const rows = body.rows ?? []
    if (!Array.isArray(rows)) return NextResponse.json({ error: 'rows must be array' }, { status: 400 })

    // basic schema validation & include optional columns price_usd and order_type
    const inserts = rows.map((r: any) => {
      // normalize price to number or null
      const rawPrice = r.price_usd ?? r.price ?? null
      const price = rawPrice === null || rawPrice === '' ? null : Number(rawPrice)
      return {
        user_id: r.user_id ?? null,
        symbol: r.symbol,
        amount: r.amount,
        price_usd: price,
        order_type: r.order_type ?? null,
        date: r.date,
        file_name: r.file_name,
      }
    })
    const { error } = await sb.from('transactions').insert(inserts)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ inserted: inserts.length })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
