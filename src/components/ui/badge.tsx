"use client"
import * as React from 'react'
import { cn } from '@/lib/utils'

export default function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
        className
      )}
    >
      {children}
    </span>
  )
}
