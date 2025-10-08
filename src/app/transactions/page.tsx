"use client"
import React, { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabaseClient'

type Tx = { id: string; symbol: string; amount: number; price_usd?: number | null; order_type?: string | null; date: string | null; file_name?: string | null }

export default function TransactionsPage() {
  const { user } = useAuth()
  const [rows, setRows] = useState<Tx[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(25)
  const [filterSymbol, setFilterSymbol] = useState('')
  const [filterFile, setFilterFile] = useState('')
  const [fromDate, setFromDate] = useState<string | null>(null)
  const [toDate, setToDate] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    let query = supabase
      .from('transactions')
      .select('id, symbol, amount, price_usd, order_type, date, file_name')
      .eq('user_id', user.id)

    if (filterSymbol) query = query.ilike('symbol', `%${filterSymbol}%`)
    if (filterFile) query = query.ilike('file_name', `%${filterFile}%`)
    if (fromDate) query = query.gte('date', fromDate)
    if (toDate) query = query.lte('date', toDate)

    const offset = (page - 1) * pageSize
    const { data, error } = await query.order('date', { ascending: false }).range(offset, offset + pageSize - 1)

    if (error) setError(error.message)
    else setRows((data ?? []) as Tx[])
    setLoading(false)
  }, [user, filterSymbol, filterFile, fromDate, toDate, page, pageSize])

  useEffect(() => {
    load()
    if (!user) return
    const channel = supabase.channel('public:transactions')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transactions' }, () => {
        load()
      })
      .subscribe()

    return () => { try { channel.unsubscribe() } catch {} }
  }, [user, load])

  if (!user) return <div className="p-4">Please sign in to view your transactions.</div>

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-3">My Transactions (Realtime)</h2>
      <div className="flex gap-2 items-center mb-3">
        <input value={filterSymbol} onChange={e => setFilterSymbol(e.target.value)} placeholder="Filter symbol" className="border px-2 py-1 rounded" />
        <input value={filterFile} onChange={e => setFilterFile(e.target.value)} placeholder="Filter file" className="border px-2 py-1 rounded" />
        <input type="date" onChange={e => setFromDate(e.target.value || null)} className="border px-2 py-1 rounded" />
        <input type="date" onChange={e => setToDate(e.target.value || null)} className="border px-2 py-1 rounded" />
        <button onClick={() => { setPage(1); load() }} className="bg-gray-100 px-3 py-1 rounded">Apply</button>
      </div>
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
      <div className="mt-3 flex items-center gap-2">
        <button disabled={page <= 1} onClick={() => { setPage(p => Math.max(1, p-1)); load() }} className="px-3 py-1 border rounded">Prev</button>
        <div>Page {page}</div>
        <button onClick={() => { setPage(p => p+1); load() }} className="px-3 py-1 border rounded">Next</button>
      </div>
    </div>
  )
}
