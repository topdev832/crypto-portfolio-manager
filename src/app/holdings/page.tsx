"use client"
import React, { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'

type Holding = { symbol: string; total: number }

// Updated to fetch holdings from server-side API
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
  const { data: sessionData } = await supabase.auth.getSession()
  const token = sessionData?.session?.access_token ?? ''

      const params = new URLSearchParams()
      if (filterSymbol) params.set('symbol', filterSymbol)
      params.set('page', '1')
      params.set('pageSize', '100')

  const res = await fetch('/api/holdings?' + params.toString(), { headers: { Authorization: `Bearer ${token}`, 'x-user-id': user.id } })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to load holdings')
      setHoldings((json.data ?? []) as Holding[])
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
    } finally {
      setLoading(false)
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
