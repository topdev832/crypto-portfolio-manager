"use client"
import React, { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'

type Holding = { symbol: string; total: number }

export default function HoldingsPage() {
  const { user } = useAuth()
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filterSymbol, setFilterSymbol] = useState('')

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const resp = await supabase
        .from('transactions')
        .select('symbol, amount')
        .eq('user_id', user.id)
        .limit(10000)

      // supabase-js may return { data, error }
  const respAny = resp as { data?: unknown; error?: unknown }
  const data = respAny.data ?? resp
  const err = respAny.error ?? null
      if (err) {
        const errObj = err as unknown
        let em = String(errObj)
        if (errObj && typeof errObj === 'object' && 'message' in errObj) {
          
          em = (errObj as { message?: string }).message ?? em
        }
        setError(em)
        setLoading(false)
        return
      }
      if (!Array.isArray(data)) {
        console.error('Unexpected holdings query response', resp)
        setError('Unexpected response from database')
        setLoading(false)
        return
      }
      // proceed with data
      // aggregate in-memory
      const map: Record<string, number> = {}
      type Row = { symbol?: string; amount?: number }
      ;((data as Row[]) ?? []).forEach((r) => {
        const sym = String(r.symbol ?? '').toUpperCase()
        const amt = Number(r.amount ?? 0)
        map[sym] = (map[sym] ?? 0) + amt
      })
      const arr = Object.entries(map).map(([symbol, total]) => ({ symbol, total }))
      // apply client-side symbol filter
      const filtered = filterSymbol ? arr.filter(a => a.symbol.includes(filterSymbol.toUpperCase())) : arr
      setHoldings(filtered)
      setLoading(false)
      return
    } catch (e) {
      console.error('Holdings query failed', e)
      setError(String(e))
      setLoading(false)
      return
    }
  }, [user, filterSymbol])

  useEffect(() => {
    ;(async () => {
      try {
        await load()
        if (!user) return
        if (typeof (supabase as unknown as { channel?: unknown }).channel !== 'function') {
          console.warn('supabase.channel is not available in this environment')
          return
        }
        const channel = supabase
          .channel('public:transactions')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transactions' }, () => {
            load()
          })
          .subscribe()

        return () => { try { channel.unsubscribe() } catch (e) { console.error('channel unsubscribe failed', e) } }
      } catch (err) {
        console.error('Holdings load/subscribe error', err)
        const message = err instanceof Error ? err.message : String(err)
        setError(message)
      }
    })()
  }, [load, user])

  if (!user) return <div className="p-4">Please sign in to view holdings.</div>

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-3">Holdings</h2>
      <div className="mb-3">
        <input placeholder="Filter symbol" value={filterSymbol} onChange={e => setFilterSymbol(e.target.value)} className="border px-2 py-1 rounded" />
      </div>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600">Error: {error}</p>}
      {holdings.length === 0 && !loading && <p>No holdings found.</p>}
      {holdings.length > 0 && (
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left">Symbol</th>
              <th className="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {holdings.map(h => (
              <tr key={h.symbol} className="border-t">
                <td>{h.symbol}</td>
                <td className="text-right">{h.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
