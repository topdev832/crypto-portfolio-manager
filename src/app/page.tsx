"use client"
import React from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import Card from '@/components/ui/card'
import Button from '@/components/ui/button'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { ArrowUpIcon, WalletIcon, FilePlusIcon } from '@/components/icons'
import Badge from '@/components/ui/badge'
import Sparkline from '@/components/ui/sparkline'

export default function Home() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold">Crypto Portfolio Manager</h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">Track your holdings and import CSV/XLSX trades</p>
          </div>
          <div>
            {!user ? (
              <div className="flex gap-3">
                <Button asChild variant="outline">
                  <Link href="/auth/signin">Sign in</Link>
                </Button>
                <Button asChild variant="default" className="bg-gradient-to-r from-indigo-600 to-blue-500 text-white">
                  <Link href="/auth/signup">Sign up</Link>
                </Button>
              </div>
            ) : (
              <div className="text-sm text-slate-700 dark:text-slate-200">Welcome, {user.email}</div>
            )}
          </div>
        </header>

        {!user ? (
          <section className="rounded-lg bg-white dark:bg-slate-800 shadow p-8">
            <h2 className="text-lg font-semibold mb-3">Get started</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">Sign up or sign in to upload trades and see your portfolio.</p>
            <div className="flex gap-3">
              <Button asChild variant="default" className="bg-gradient-to-r from-indigo-600 to-blue-500 text-white">
                <Link href="/auth/signup">Create account</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/auth/signin">Have an account? Sign in</Link>
              </Button>
            </div>
          </section>
        ) : (
          <>
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="p-5" header={<div className="flex items-center gap-3"><WalletIcon className="w-6 h-6 text-indigo-500" /><div><div className="text-xs text-slate-500">Total Portfolio</div><div className="text-lg font-bold">$427.9k</div></div></div>}>
                <div className="text-sm text-slate-500">+3.2% from last month</div>
              </Card>

              <Card className="p-5" header={<div className="flex items-center gap-3"><ArrowUpIcon className="w-6 h-6 text-green-500" /><div><div className="text-xs text-slate-500">Gains (30d)</div><div className="text-lg font-bold">$165.2k</div></div></div>}>
                <div className="text-sm text-slate-500">Realized + unrealized</div>
              </Card>

              <Card className="p-5" header={<div className="flex items-center gap-3"><FilePlusIcon className="w-6 h-6 text-amber-500" /><div><div className="text-xs text-slate-500">Pending</div><div className="text-lg font-bold">$42k</div></div></div>}>
                <div className="text-sm text-slate-500">Transactions pending processing</div>
              </Card>
            </section>

            <Dashboard userId={user.id} />
          </>
        )}
      </div>
    </div>
  )
}

type Transaction = {
  id: string
  symbol: string
  amount: number
  price: number
  order: 'BUY' | 'SELL'
  date: string
}

function Dashboard({ userId }: { userId: string }) {
  const [holdings, setHoldings] = useState<Array<{ symbol: string; total: number }>>([])
  const [recent, setRecent] = useState<Transaction[]>([])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        const token = sessionData?.session?.access_token ?? ''

        const hRes = await fetch('/api/holdings?page=1&pageSize=50', { headers: { Authorization: `Bearer ${token}`, 'x-user-id': userId } })
        const hJson = await hRes.json()
        if (hRes.ok && mounted) setHoldings(hJson.data ?? [])

        const txRes = await fetch('/api/transactions?page=1&pageSize=10', { headers: { Authorization: `Bearer ${token}`, 'x-user-id': userId } })
        const txJson = await txRes.json()
        if (txRes.ok && mounted) setRecent(txJson.data ?? [])
      } catch (e) {
        console.error('dashboard fetch', e)
      }
    })()
    return () => { mounted = false }
  }, [userId])

  return (
    <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card header={<div className="flex items-center justify-between"><div><h3 className="text-lg font-semibold">Holdings</h3><p className="text-sm text-slate-500">Aggregated by symbol</p></div><div><Button asChild variant="outline"><Link href="/holdings">View all</Link></Button></div></div>}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="pb-2">Asset</th>
                  <th className="pb-2">Amount</th>
                  <th className="pb-2">Value (USD)</th>
                  <th className="pb-2">Trend</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((h) => (
                  <tr key={h.symbol} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-blue-500 flex items-center justify-center text-white font-bold">{h.symbol[0]}</div>
                        <div>
                          <div className="font-medium">{h.symbol}</div>
                          <div className="text-xs text-slate-500">{h.total.toFixed(4)} units</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">{h.total.toFixed(4)}</td>
                    <td className="py-3">${(h.total * 42).toLocaleString()}</td>
                    <td className="py-3 text-slate-500"><Sparkline data={[1,2,3,2,4,3,5]} /></td>
                  </tr>
                ))}
                {holdings.length === 0 && <tr><td colSpan={4} className="py-6 text-center text-slate-500">No holdings yet</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <div className="flex flex-col gap-6">
        <Card header={<div className="flex items-center justify-between"><h3 className="text-lg font-semibold">Quick Actions</h3><Badge>New</Badge></div>}>
          <div className="flex flex-col gap-3">
            <Button asChild variant="default" className="w-full bg-gradient-to-r from-indigo-600 to-blue-500 text-white"><Link href="/upload">Upload Transactions</Link></Button>
            <Button asChild variant="outline" className="w-full"><Link href="/transactions">View Transactions</Link></Button>
          </div>
        </Card>

        <Card header={<h3 className="text-lg font-semibold">Recent Transactions</h3>}>
          <div className="space-y-3">
            {recent.map((t: Transaction) => {
              const dateStr = t.date ? new Date(t.date).toLocaleDateString() : '—'
              const priceStr = typeof t.price === 'number' ? `$${t.price.toLocaleString()}` : '—'
              const amountStr = typeof t.amount === 'number' ? String(t.amount) : (t.amount ?? '—')
              return (
                <div key={t.id} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{t.symbol ?? '—'}</div>
                    <div className="text-xs text-slate-500">{dateStr} · {t.order ?? '—'}</div>
                  </div>
                  <div className="text-right">
                    <div className={t.order === 'BUY' ? 'text-green-600' : 'text-red-600'}>{priceStr}</div>
                    <div className="text-xs text-slate-500">{amountStr}</div>
                  </div>
                </div>
              )
            })}
            {recent.length === 0 && <div className="text-sm text-slate-500">No recent transactions</div>}
          </div>
        </Card>
      </div>
    </section>
  )
}
