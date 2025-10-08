"use client"
import React, { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabaseClient'

type Tx = { id: string; symbol: string; amount: number; price_usd?: number | null; order_type?: string | null; date: string | null; file_name?: string | null }

export default function TransactionsPage() {
  const { user } = useAuth()
  const [rows, setRows] = useState<Tx[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('transactions')
      .select('id, symbol, amount, price_usd, order_type, date, file_name')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(500)

    if (error) setError(error.message)
    else setRows((data ?? []) as Tx[])
    setLoading(false)
  }

  useEffect(() => {
    load()
    if (!user) return
    const channel = supabase.channel('public:transactions')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transactions' }, () => {
        load()
      })
      .subscribe()

    return () => { try { channel.unsubscribe() } catch {} }
  }, [user])

  if (!user) return <div className="p-4">Please sign in to view your transactions.</div>

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-3">My Transactions (Realtime)</h2>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600">Error: {error}</p>}
      {!loading && rows.length === 0 && <p>No transactions found.</p>}

      {rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th className="text-left font-medium">Date</th>
                <th className="text-left font-medium">Symbol</th>
                <th className="text-right font-medium">Amount</th>
                <th className="text-right font-medium">Price (USD)</th>
                <th className="text-center font-medium">Order</th>
                <th className="text-left font-medium">File</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-t">
                  <td>{r.date ?? ''}</td>
                  <td>{r.symbol}</td>
                  <td className="text-right">{r.amount}</td>
                  <td className="text-right">{r.price_usd ?? ''}</td>
                  <td className="text-center">{r.order_type ?? ''}</td>
                  <td>{r.file_name ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
