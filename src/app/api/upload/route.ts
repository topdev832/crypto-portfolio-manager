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

    // per-row validation: skip negative amounts and duplicates
    const toInsert: any[] = []
    const skipped: Array<{ index: number; reason: string; row: any }> = []

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]
      const rawPrice = r.price_usd ?? r.price ?? null
      const price = rawPrice === null || rawPrice === '' ? null : Number(rawPrice)
      const amount = Number(r.amount ?? 0)

      if (isNaN(amount)) {
        skipped.push({ index: i, reason: 'invalid amount', row: r })
        continue
      }
      if (amount < 0) {
        skipped.push({ index: i, reason: 'negative amount', row: r })
        continue
      }

      // check duplicate: same user_id, symbol, amount, date, file_name
      const { data: exists, error: existsErr } = await sb.from('transactions').select('id').match({ user_id: r.user_id ?? null, symbol: r.symbol, amount, date: r.date, file_name: r.file_name }).limit(1)
      if (existsErr) {
        // database check error -> treat as skip with reason
        skipped.push({ index: i, reason: 'db check error: ' + existsErr.message, row: r })
        continue
      }
      if (Array.isArray(exists) && exists.length > 0) {
        skipped.push({ index: i, reason: 'duplicate', row: r })
        continue
      }

      toInsert.push({ user_id: r.user_id ?? null, symbol: r.symbol, amount, price_usd: price, order_type: r.order_type ?? null, date: r.date, file_name: r.file_name })
    }

    if (toInsert.length === 0) return NextResponse.json({ inserted: 0, skipped })

    const { error: insertErr } = await sb.from('transactions').insert(toInsert)
    if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 })
    return NextResponse.json({ inserted: toInsert.length, skipped })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
