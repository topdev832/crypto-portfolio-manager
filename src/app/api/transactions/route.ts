/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const sb = createClient(url, serviceKey)

export async function GET(req: Request) {
  try {
    const q = new URL(req.url)
    const page = Number(q.searchParams.get('page') ?? '1')
    const pageSize = Number(q.searchParams.get('pageSize') ?? '25')
    const symbol = q.searchParams.get('symbol') ?? ''
    const file = q.searchParams.get('file') ?? ''
    const from = q.searchParams.get('from') ?? ''
    const to = q.searchParams.get('to') ?? ''

    // support an override header for user id (client already authenticated)
    const overrideUserId = req.headers.get('x-user-id') ?? ''
    let userId: string | undefined
    if (overrideUserId) {
      // use provided user id without token validation
      userId = overrideUserId
    } else {
      const auth = req.headers.get('authorization') ?? ''
      const token = auth.startsWith('Bearer ') ? auth.replace('Bearer ', '') : auth
      if (!token) return NextResponse.json({ error: 'missing authorization token' }, { status: 401 })

      const { data: userData, error: userErr } = await sb.auth.getUser(token)
      if (userErr || !userData?.user) return NextResponse.json({ error: 'invalid token' }, { status: 401 })
  userId = userData.user.id
    }

    const offset = (page - 1) * pageSize
    let query = sb.from('transactions').select('id, symbol, amount, price_usd, order_type, date, file_name').eq('user_id', userId)
    if (symbol) query = query.ilike('symbol', `%${symbol}%`)
    if (file) query = query.ilike('file_name', `%${file}%`)
    if (from) query = query.gte('date', from)
    if (to) query = query.lte('date', to)

    const { data, error } = await query.order('date', { ascending: false }).range(offset, offset + pageSize - 1)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data, page, pageSize })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
