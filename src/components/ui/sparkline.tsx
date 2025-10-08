"use client"
import * as React from 'react'

export default function Sparkline({ data = [], className = '' }: { data?: number[]; className?: string }) {
  if (!data || data.length === 0) return <svg className={className} width={80} height={24} />
  const max = Math.max(...data)
  const min = Math.min(...data)
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 80
    const y = 24 - ((d - min) / (max - min || 1)) * 24
    return `${x},${y}`
  })
  return (
    <svg className={className} width={80} height={24} viewBox="0 0 80 24" preserveAspectRatio="none">
      <polyline fill="none" stroke="currentColor" strokeWidth={1.5} points={points.join(' ')} />
    </svg>
  )
}
