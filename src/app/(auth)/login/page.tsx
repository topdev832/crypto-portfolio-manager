"use client"
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import Button from '@/components/ui/button'
import Card from '@/components/ui/card'

export default function LoginPage() {
  const { signIn } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMsg('')
    const res = await signIn(email, password)
    setLoading(false)
    if (res.error) setMsg(res.error.message)
    else router.push('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800">
      <div className="w-full max-w-md px-4 py-24">
        <Card className="p-8 bg-gradient-to-br from-slate-800/60 to-slate-800/30 backdrop-blur-md border border-white/6 shadow-2xl rounded-2xl">
          <h1 className="text-3xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-green-300 to-emerald-400">Login</h1>

          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="block text-sm text-slate-300 mb-2">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/3 text-white placeholder:text-slate-400 px-4 py-3 rounded-lg border border-white/10 shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-400"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/3 text-white placeholder:text-slate-400 px-4 py-3 rounded-lg border border-white/10 shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-400"
                placeholder="••••••••"
              />
            </div>

            {msg && <p className="text-sm text-rose-400">{msg}</p>}

            <div>
              <Button type="submit" className="w-full py-3 rounded-xl text-lg shadow-lg bg-gradient-to-r from-green-500 to-emerald-400" disabled={loading}>
                {loading ? 'Signing in…' : 'Login'}
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center text-sm text-slate-300">
            New to the app? <a href="/auth/signup" className="text-cyan-300 hover:underline">Create account</a>
          </div>
        </Card>
      </div>
    </div>
  )
}
