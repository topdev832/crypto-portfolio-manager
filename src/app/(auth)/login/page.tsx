"use client"
import React, { useState } from 'react'
import { useAuth } from '@/context/AuthContext'

export default function LoginPage() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await signIn(email, password)
    if (res.error) setMsg(res.error.message)
    else setMsg('Signed in')
  }

  return (
    <form onSubmit={submit} className="p-4">
      <h2 className="text-lg font-bold mb-2">Login</h2>
      <input className="border p-2 mb-2 w-full" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" />
      <input className="border p-2 mb-2 w-full" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" type="password" />
      <button className="bg-green-600 text-white px-3 py-2 rounded">Login</button>
      {msg && <p className="mt-2 text-sm">{msg}</p>}
    </form>
  )
}
