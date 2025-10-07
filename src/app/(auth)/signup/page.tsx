"use client"
import React, { useState } from 'react'
import { useAuth } from '@/context/AuthContext'

export default function SignUpPage() {
  const { signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await signUp(email, password)
    if (res.error) setMsg(res.error.message)
    else setMsg('Check your email for confirmation (if required)')
  }

  return (
    <form onSubmit={submit} className="p-4">
      <h2 className="text-lg font-bold mb-2">Sign up</h2>
      <input className="border p-2 mb-2 w-full" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" />
      <input className="border p-2 mb-2 w-full" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" type="password" />
      <button className="bg-blue-600 text-white px-3 py-2 rounded">Sign up</button>
      {msg && <p className="mt-2 text-sm">{msg}</p>}
    </form>
  )
}
