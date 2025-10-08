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

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)

    const { data, error } = await supabase
      .from('transactions')
      .select('symbol, amount')
      .eq('user_id', user.id)
      .limit(10000)

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // aggregate in-memory
    const map: Record<string, number> = {}
    type Row = { symbol?: string; amount?: number }
    ;((data as Row[]) ?? []).forEach((r) => {
      const sym = String(r.symbol ?? '').toUpperCase()
      const amt = Number(r.amount ?? 0)
      map[sym] = (map[sym] ?? 0) + amt
    })
    const arr = Object.entries(map).map(([symbol, total]) => ({ symbol, total }))
    setHoldings(arr)
    setLoading(false)
  }, [user])

  useEffect(() => {
    load()
    if (!user) return
    const channel = supabase
      .channel('public:transactions')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transactions' }, () => {
        load()
      })
      .subscribe()

    return () => { try { channel.unsubscribe() } catch {} }
  }, [load, user])

  if (!user) return <div className="p-4">Please sign in to view holdings.</div>

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-3">Holdings</h2>
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
