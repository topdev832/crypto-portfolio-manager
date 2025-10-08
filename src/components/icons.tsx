import * as React from 'react'

export function WalletIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...props}>
      <rect x={2} y={6} width={20} height={12} rx={2} stroke="currentColor" />
      <path d="M16 10h2" stroke="currentColor" />
    </svg>
  )
}

export function ArrowUpIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...props}>
      <path d="M12 19V6" stroke="currentColor" />
      <path d="M5 12l7-7 7 7" stroke="currentColor" />
    </svg>
  )
}

export function FilePlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...props}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" />
      <path d="M14 2v6h6" stroke="currentColor" />
      <path d="M12 11v6" stroke="currentColor" />
      <path d="M9 14h6" stroke="currentColor" />
    </svg>
  )
}

 