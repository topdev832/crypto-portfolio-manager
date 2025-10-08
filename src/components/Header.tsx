"use client"
import React from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import Button from '@/components/ui/button'

export default function Header() {
  const { user, signOut } = useAuth()

  return (
    <header className="bg-white border-b">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/" className="font-bold text-lg">Portfolio</Link>
          <nav className="flex gap-2">
            <Link href="/upload" className="px-2 py-1 rounded hover:bg-gray-100">Upload</Link>
            <Link href="/transactions" className="px-2 py-1 rounded hover:bg-gray-100">Transactions</Link>
            <Link href="/holdings" className="px-2 py-1 rounded hover:bg-gray-100">Holdings</Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="text-sm text-gray-700">{user.email}</span>
              <Button onClick={() => signOut()} className="px-2 py-1 border rounded text-sm">Sign out</Button>
            </>
          ) : (
            <>
              <Button asChild>
                <Link href="/auth/signin">Sign in</Link>
              </Button>
              <Button asChild variant="default" className="bg-blue-600 text-white rounded text-sm">
                <Link href="/auth/signup">Sign up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
