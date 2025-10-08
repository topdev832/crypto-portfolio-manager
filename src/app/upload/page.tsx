/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import React, { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import Papa from 'papaparse'

// To support Excel (.xlsx/.xls) parsing install SheetJS in the project:
// npm install xlsx

type Tx = { symbol: string; amount: number; price_usd?: number; order_type?: string; date: string; file_name?: string; user_id?: string }

export default function UploadPage() {
  const { user } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [msg, setMsg] = useState('')
  const [uploadDate, setUploadDate] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [preview, setPreview] = useState<Array<{ symbol: string; amount: any; amountDisplay: string; price?: any; priceDisplay?: string; order_type?: string; date: Date | null; dateDisplay: string; dateISO: string; raw: any; isDuplicate?: boolean; isNegative?: boolean }>>([])
  const [selected, setSelected] = useState<Record<number, boolean>>({})

  const onFile = (f: File | null) => setFile(f)

  const parseToPreview = async () => {
  setMsg('Parsing...')
  setPreview([])
  setSelected({})
  if (!file) return setMsg('Select a CSV or Excel (.xlsx) file')

    const filename = file.name.toLowerCase()
    let rows: any[] = []

    try {
      if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) {
        try {
          // dynamic import of optional dependency and support default export
          const mod = await import('xlsx')
          // module may export as default or named
          const xlsx = mod.default ?? mod
          const data = await file.arrayBuffer()
          // read with cellDates so date cells become Date objects where possible
          const workbook = xlsx.read(data, { type: 'array', cellDates: true })
          const sheetName = workbook.SheetNames[0]
          const sheet = workbook.Sheets[sheetName]
          // raw:false will prefer formatted text for cells (dates/numbers)
          rows = xlsx.utils.sheet_to_json(sheet, { defval: '', raw: false }) as any[]
        } catch (err) {
          console.error('Excel parse error', err)
          setMsg('Excel parsing failed. Ensure `xlsx` is installed (npm install xlsx) or convert your file to CSV. Error: ' + String(err))
          return
        }
      } else {
        rows = await new Promise<any[]>((resolve, reject) => {
          Papa.parse(file, {
            header: true,
            dynamicTyping: true,
            complete: (results: any) => resolve(results.data),
            error: (err: any) => reject(err),
          })
        })
      }
    } catch (err) {
      setMsg('Failed to parse file: ' + String(err))
      return
    }

    // helper: convert Excel serial to JS Date
    const excelSerialToJSDate = (serial: number) => {
      return new Date(Math.round((serial - 25569) * 86400 * 1000))
    }

    // Basic validation: required columns
    const firstRow = rows[0] ?? {}
    const headerKeys = Object.keys(firstRow).map((k: string) => k.toLowerCase())
    const hasSymbol = headerKeys.some((k: string) => ['symbol', 'asset', 'ticker'].includes(k))
    const hasAmount = headerKeys.some((k: string) => ['amount', 'quantity', 'qty'].includes(k))
    const hasDate = headerKeys.some((k: string) => ['date', 'trade date', 'timestamp'].includes(k))
    if (!hasSymbol || !hasAmount || !hasDate) {
      setMsg('File missing required headers: symbol, amount, date. Please ensure your file has these columns.')
      return
    }

    // Map to preview shape using common column names and format for display
    const mapped = rows.map((r: any) => {
      const symbolRaw = r.symbol ?? r.Symbol ?? r['Asset'] ?? r['Ticker'] ?? ''
      const amountRaw = r.amount ?? r.Amount ?? r['Quantity'] ?? r['Qty'] ?? ''
      const priceRaw = r.price_usd ?? r.price ?? r.Price ?? r['Price_USD'] ?? ''
      const orderRaw = r.order_type ?? r.order_typ ?? r.order ?? r.Order ?? ''
      const dateRaw = r.date ?? r.Date ?? r['Trade Date'] ?? r['Timestamp'] ?? ''

      // Normalize date: could be Date object, number, or string
      let dateVal: Date | null = null
      if (dateRaw instanceof Date) {
        dateVal = dateRaw
      } else if (typeof dateRaw === 'number') {
        dateVal = excelSerialToJSDate(dateRaw)
      } else if (typeof dateRaw === 'string' && /^\d+$/.test(dateRaw)) {
        dateVal = excelSerialToJSDate(Number(dateRaw))
      } else if (typeof dateRaw === 'string' && dateRaw.trim() !== '') {
        const parsed = new Date(dateRaw)
        dateVal = isNaN(parsed.getTime()) ? null : parsed
      }

      const amountDisplay = (typeof amountRaw === 'number')
        ? new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 }).format(amountRaw)
        : String(amountRaw)

      // Normalize price: try to coerce strings like "9.45" or "1,234.56" or "$9.45" to numbers
      let priceVal: number | undefined = undefined
      if (typeof priceRaw === 'number') {
        priceVal = priceRaw
      } else if (typeof priceRaw === 'string' && priceRaw.trim() !== '') {
        // remove common thousands separators and currency symbols
        const cleaned = priceRaw.replace(/[$,\s]/g, '')
        const n = Number(cleaned)
        if (!isNaN(n)) priceVal = n
      }

      const priceDisplay = (typeof priceVal === 'number')
        ? new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(priceVal)
        : (priceRaw ? String(priceRaw) : '')

      const dateDisplay = dateVal instanceof Date ? dateVal.toLocaleDateString() : String(dateRaw)
      const dateISO = dateVal instanceof Date ? dateVal.toISOString().slice(0, 10) : ''

      return { raw: r, symbol: String(symbolRaw).trim(), amount: amountRaw, amountDisplay, price: priceVal, priceDisplay, order_type: String(orderRaw), date: dateVal, dateDisplay, dateISO, isDuplicate: false, isNegative: (typeof amountRaw === 'number' && amountRaw < 0) }
    })

    // detect duplicates in preview (same symbol|amount|date)
    const seen = new Set<string>()
    mapped.forEach((row) => {
      const key = `${row.symbol}|${String(row.amount)}|${row.dateISO}`
      if (seen.has(key)) row.isDuplicate = true
      else seen.add(key)
    })

    setPreview(mapped)
    const sel: Record<number, boolean> = {}
    mapped.forEach((row, i) => {
      if (row.symbol && row.amount && row.dateDisplay) sel[i] = true
    })
    setSelected(sel)
    setMsg('Preview loaded (' + mapped.length + ' rows)')
  }

  const submit = async () => {
    setMsg('')
    if (preview.length === 0) {
      setBusy(false)
      return setMsg('No preview available. Click "Preview" first.')
    }

    if (!user) {
      setBusy(false)
      return setMsg('Please sign in before uploading')
    }

    setBusy(true)

    const rowsToUpload: Tx[] = []
    for (let i = 0; i < preview.length; i++) {
      if (!selected[i]) continue
      const r = preview[i]
  if (!r.symbol || !r.amount || !r.dateISO) continue
  // skip obvious negatives/duplicates on client
  if (r.isNegative) continue
  if (r.isDuplicate) continue
  rowsToUpload.push({ symbol: String(r.symbol), amount: Number(r.amount), price_usd: typeof r.price === 'number' ? Number(r.price) : undefined, order_type: r.order_type || undefined, date: r.dateISO, file_name: file?.name, user_id: user.id })
    }

    if (rowsToUpload.length === 0) return setMsg('No valid rows selected for upload.')

    try {
      const res = await fetch('/api/upload', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rows: rowsToUpload }) })
      const json = await res.json()
      if (res.ok) {
        const inserted = json.inserted ?? 0
        const skipped = json.skipped ?? []
        let m = 'Inserted ' + inserted + ' rows'
        if (skipped.length > 0) m += ' — skipped ' + skipped.length + ' rows (duplicates/invalid)'
        setMsg(m)
      } else setMsg('Error: ' + json.error)
    } catch (err: any) {
      setMsg('Upload failed: ' + String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-2">Upload CSV / Excel</h2>
      <input id="file" type="file" accept=",.csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={e => onFile(e.target.files?.[0] ?? null)} />
      {file && <p className="mt-2 text-sm">Selected file: {file.name}</p>}
      <p className="mt-2 text-xs text-gray-600">If you can&apos;t see CSV files in the dialog: navigate to the folder containing them, set the File name box to <code>*.csv</code> or change the file type selector to &quot;All files&quot;.</p>

      <div className="mt-3 flex gap-2">
        <button onClick={parseToPreview} disabled={busy} className="bg-gray-200 px-3 py-2 rounded disabled:opacity-60">Preview</button>
        <button onClick={submit} disabled={busy} className="bg-blue-600 text-white px-3 py-2 rounded disabled:opacity-60">{busy ? 'Uploading...' : 'Upload'}</button>
      </div>

      {msg && <p className="mt-2">{msg}</p>}

      {preview.length > 0 && (
        <div className="mt-4">
          <div className="flex items-baseline justify-between">
            <h3 className="font-semibold">Preview (first 50 rows)</h3>
            <div className="text-sm text-gray-600">File: {file?.name} {uploadDate ? ` • preview date: ${uploadDate}` : ''}</div>
          </div>
          <table className="w-full text-sm border-collapse mt-2">
            <thead>
              <tr>
                <th className="w-6"></th>
                <th className="text-left font-medium">Symbol</th>
                <th className="text-center font-medium">Amount</th>
                <th className="text-right font-medium">Price</th>
                <th className="text-center font-medium">Order</th>
                <th className="text-left font-medium">Date</th>
                <th className="text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {preview.slice(0, 50).map((r, i) => (
                <tr key={i} className="border-t">
                    <td className="pr-2"><input type="checkbox" checked={!!selected[i]} onChange={e => setSelected(prev => ({ ...prev, [i]: e.target.checked }))} /></td>
                    <td>{r.symbol}</td>
                    <td className="text-center">{r.amountDisplay}</td>
                    <td className="text-right">{r.priceDisplay}</td>
                    <td className="text-center">{r.order_type}</td>
                    <td>{r.dateDisplay}</td>
                    <td className="pl-2 text-xs text-gray-500">
                      {r.isDuplicate && <span className="text-yellow-600">Duplicate</span>}
                      {r.isNegative && <span className="text-red-600"> Negative</span>}
                    </td>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
