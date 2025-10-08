"use client"
import React from 'react'
import { cn } from '@/lib/utils'

type CardProps = {
  children: React.ReactNode
  className?: string
  header?: React.ReactNode
  footer?: React.ReactNode
}

export default function Card({ children, className, header, footer }: CardProps) {
  return (
    <div className={cn('rounded-lg p-6 bg-white dark:bg-slate-900 shadow-sm border border-transparent dark:border-slate-800', className)}>
      {header ? <div className="mb-4 flex items-start justify-between">{header}</div> : null}
      <div>{children}</div>
      {footer ? <div className="mt-4">{footer}</div> : null}
    </div>
  )
}
