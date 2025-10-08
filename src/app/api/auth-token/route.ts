import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET() {
  // This endpoint runs in the browser (client calling it). Use client supabase to read session.
  try {
    const { data } = await supabase.auth.getSession()
    const token = data?.session?.access_token ?? null
    return NextResponse.json({ access_token: token })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
