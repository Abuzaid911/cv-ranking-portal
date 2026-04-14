import { useState, useCallback } from 'react'
import type { ReceiptAnalysis, Provider } from '../types'
import { PROVIDERS } from '../types'
import { analyzeReceipt } from '../services/analyzeReceipt'
import ReceiptCard from '../components/ReceiptCard'
import ReceiptDetailModal from '../components/ReceiptDetailModal'
import { IconSpinner, IconReceipt, IconWarning, IconX, IconChartBar } from '../components/Icons'

interface Props {
  provider: Provider
  apiKey: string
  endpoint: string
}

// ─── Receipt Upload Zone ──────────────────────────────────────────────────────
function ReceiptUploadZone({
  onFiles,
  disabled,
}: {
  onFiles: (files: File[]) => void
  disabled?: boolean
}) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useState<HTMLInputElement | null>(null)

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList) return
      const valid = Array.from(fileList).filter((f) =>
        f.type.startsWith('image/') ||
        f.type === 'application/pdf' ||
        /\.(pdf|jpg|jpeg|png|webp|heic|gif|bmp)$/i.test(f.name),
      )
      if (valid.length) onFiles(valid)
    },
    [onFiles],
  )

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (!disabled) handleFiles(e.dataTransfer.files)
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => {
        if (!disabled) {
          const el = document.getElementById('receipt-file-input')
          el?.click()
        }
      }}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !disabled)
          (document.getElementById('receipt-file-input') as HTMLInputElement)?.click()
      }}
      aria-label="Upload receipt files"
      className={[
        'relative border-2 border-dashed rounded-2xl p-10 text-center select-none',
        'transition-all duration-200 ease-out',
        disabled
          ? 'opacity-40 cursor-not-allowed'
          : 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#22C55E] focus:ring-offset-2 focus:ring-offset-[#020817]',
        dragging
          ? 'border-[#22C55E] bg-[#22C55E]/8 scale-[1.01]'
          : disabled
            ? 'border-[#334155] bg-[#0F172A]'
            : 'border-[#334155] bg-[#0F172A] hover:border-[#22C55E]/60 hover:bg-[#22C55E]/5',
      ].join(' ')}
    >
      <input
        id="receipt-file-input"
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.gif,.bmp,application/pdf,image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
        disabled={disabled}
      />

      <div className="flex flex-col items-center gap-4 pointer-events-none">
        <div className={`relative transition-transform duration-200 ${dragging ? 'scale-110' : ''}`}>
          <div className="w-16 h-16 rounded-2xl bg-[#22C55E]/10 border border-[#22C55E]/20 flex items-center justify-center">
            <IconReceipt className="w-8 h-8 text-[#22C55E]" />
          </div>
          {dragging && (
            <div className="absolute inset-0 rounded-2xl ring-2 ring-[#22C55E]/40 animate-pulse" />
          )}
        </div>
        <div className="space-y-1.5">
          <p className="text-base font-semibold text-[#F8FAFC]">
            {dragging ? 'Drop receipts here' : 'Upload Receipts'}
          </p>
          <p className="text-sm text-[#94A3B8]">
            Drag & drop, or{' '}
            <span className="text-[#22C55E] font-medium underline underline-offset-2">browse files</span>
          </p>
          <p className="text-xs text-[#334155] pt-1">
            Supports JPG · PNG · WebP · PDF · Multiple files
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Category breakdown stats ─────────────────────────────────────────────────
function CategoryBreakdown({ receipts }: { receipts: ReceiptAnalysis[] }) {
  const done = receipts.filter((r) => r.status === 'done')
  if (done.length < 2) return null

  // Group by category
  const map = new Map<string, { count: number; total: number; currency: string }>()
  for (const r of done) {
    const existing = map.get(r.category) ?? { count: 0, total: 0, currency: r.currency }
    map.set(r.category, { count: existing.count + 1, total: existing.total + r.total, currency: r.currency })
  }

  const grandTotal = done.reduce((s, r) => s + r.total, 0)
  const sorted = [...map.entries()].sort((a, b) => b[1].total - a[1].total)

  const COLORS: Record<string, string> = {
    'Food & Dining':      'bg-orange-500',
    'Travel & Transport': 'bg-sky-500',
    'Shopping':           'bg-purple-500',
    'Utilities':          'bg-yellow-500',
    'Healthcare':         'bg-emerald-500',
    'Entertainment':      'bg-pink-500',
    'Office & Business':  'bg-slate-400',
    'Groceries':          'bg-teal-500',
    'Fuel':               'bg-amber-500',
    'Other':              'bg-gray-500',
  }

  function fmt(amount: number, currency: string) {
    try { return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount) }
    catch { return `${currency} ${amount.toFixed(2)}` }
  }

  return (
    <div className="bg-[#0F172A] border border-[#334155] rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <IconChartBar className="w-4 h-4 text-[#0EA5E9]" />
        <span className="text-sm font-bold text-[#F8FAFC]">Spend by Category</span>
      </div>
      <div className="space-y-3">
        {sorted.map(([cat, data]) => {
          const pct = grandTotal > 0 ? Math.round((data.total / grandTotal) * 100) : 0
          const color = COLORS[cat] ?? 'bg-gray-500'
          return (
            <div key={cat} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-[#CBD5E1]">{cat}</span>
                <span className="text-[#F8FAFC] font-semibold">
                  {fmt(data.total, data.currency)}{' '}
                  <span className="text-[#94A3B8] font-normal">({pct}%)</span>
                </span>
              </div>
              <div className="h-1.5 bg-[#1E293B] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${color}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
let idCounter = 0

export default function ReceiptsPage({ provider, apiKey, endpoint }: Props) {
  const [receipts, setReceipts] = useState<ReceiptAnalysis[]>([])
  const [selected, setSelected] = useState<ReceiptAnalysis | null>(null)
  const cfg = PROVIDERS.find((p) => p.id === provider)!

  const handleFiles = useCallback(
    async (files: File[]) => {
      if (!apiKey) { alert('Please enter your API key first.'); return }

      const newReceipts: ReceiptAnalysis[] = files.map((f) => ({
        id: String(++idCounter),
        fileName: f.name,
        fileUrl: '',
        fileType: (f.type.startsWith('image/') ? 'image' : 'pdf') as 'image' | 'pdf',
        status: 'analyzing',
        provider,
        merchantName: f.name.replace(/\.(pdf|jpg|jpeg|png|webp|heic)$/i, ''),
        merchantAddress: '',
        merchantPhone: '',
        date: '',
        time: '',
        receiptNumber: '',
        currency: 'USD',
        subtotal: 0,
        tax: 0,
        tip: 0,
        discount: 0,
        total: 0,
        paymentMethod: '',
        cardLast4: '',
        category: 'Other',
        lineItems: [],
        flags: [],
        summary: '',
      }))

      setReceipts((prev) => [...prev, ...newReceipts])

      const results = await Promise.all(
        files.map((file, i) =>
          analyzeReceipt(file, provider, apiKey, newReceipts[i].id, endpoint),
        ),
      )

      setReceipts((prev) => {
        const byId = new Map(results.map((r) => [r.id, r]))
        return prev.map((r) => byId.get(r.id) ?? r)
      })
    },
    [apiKey, provider, endpoint],
  )

  const handleClear = () => {
    receipts.forEach((r) => { if (r.fileUrl) URL.revokeObjectURL(r.fileUrl) })
    setReceipts([])
    setSelected(null)
  }

  const doneReceipts   = receipts.filter((r) => r.status === 'done')
  const analyzing      = receipts.filter((r) => r.status === 'analyzing').length
  const errorCount     = receipts.filter((r) => r.status === 'error').length
  const totalSpend     = doneReceipts.reduce((s, r) => s + r.total, 0)
  const currencies     = [...new Set(doneReceipts.map((r) => r.currency))]
  const mixedCurrency  = currencies.length > 1

  function fmtTotal(amount: number) {
    if (mixedCurrency) return amount.toFixed(2)
    try { return new Intl.NumberFormat('en-US', { style: 'currency', currency: currencies[0] ?? 'USD' }).format(amount) }
    catch { return `${currencies[0]} ${amount.toFixed(2)}` }
  }

  return (
    <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 space-y-6">
      {/* Upload zone */}
      <ReceiptUploadZone onFiles={handleFiles} disabled={!apiKey} />

      {/* Analyzing progress */}
      {analyzing > 0 && (
        <div className="flex items-center gap-3 text-sm text-[#22C55E]
                        bg-[#22C55E]/8 border border-[#22C55E]/20 rounded-xl px-4 py-3">
          <IconSpinner className="w-4 h-4 shrink-0 text-[#22C55E]" />
          <span>
            Analyzing{' '}
            <span className="font-bold">{analyzing}</span>
            {' '}receipt{analyzing > 1 ? 's' : ''} with{' '}
            <span className="font-bold">{cfg.name}</span>…
            <span className="text-[#94A3B8] ml-1.5">You can upload more while waiting.</span>
          </span>
        </div>
      )}

      {/* Error notice */}
      {errorCount > 0 && analyzing === 0 && (
        <div className="flex items-center gap-2.5 text-sm text-amber-400
                        bg-amber-400/8 border border-amber-400/20 rounded-xl px-4 py-3">
          <IconWarning className="w-4 h-4 shrink-0" />
          <span>
            {errorCount} receipt{errorCount > 1 ? 's' : ''} could not be analyzed.
            Make sure your image is clear and your API key supports vision.
          </span>
        </div>
      )}

      {/* Stats + category breakdown */}
      {doneReceipts.length > 0 && (
        <div className="space-y-4">
          {/* Stats bar */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-[#0F172A] border border-[#334155] rounded-xl px-4 py-2 text-sm">
              <IconReceipt className="w-4 h-4 text-[#94A3B8]" />
              <span className="text-[#94A3B8]">
                <span className="font-bold text-[#F8FAFC]">{doneReceipts.length}</span>
                {' '}receipt{doneReceipts.length !== 1 ? 's' : ''} analyzed
              </span>
            </div>
            <div className="flex items-center gap-2 bg-[#0F172A] border border-[#334155] rounded-xl px-4 py-2 text-sm">
              <span className="text-[#94A3B8]">Total spend</span>
              <span className="font-bold text-[#22C55E]">
                {mixedCurrency ? `~${fmtTotal(totalSpend)}` : fmtTotal(totalSpend)}
              </span>
              {mixedCurrency && (
                <span className="text-xs text-amber-400">Multi-currency</span>
              )}
            </div>
            <div className="flex items-center gap-2 bg-[#0F172A] border border-[#334155] rounded-xl px-4 py-2 text-sm">
              <span className="text-[#94A3B8]">Avg receipt</span>
              <span className="font-bold text-[#0EA5E9]">
                {fmtTotal(totalSpend / doneReceipts.length)}
              </span>
            </div>
            <button
              onClick={handleClear}
              className="flex items-center gap-1.5 text-xs text-[#94A3B8] hover:text-red-400
                         transition-colors duration-150 px-3 py-2 border border-[#334155]
                         hover:border-red-900/50 rounded-xl cursor-pointer ml-auto"
            >
              <IconX className="w-3.5 h-3.5" />
              Clear all
            </button>
          </div>

          {/* Category breakdown */}
          <CategoryBreakdown receipts={receipts} />
        </div>
      )}

      {/* Receipt grid */}
      {receipts.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {receipts.map((receipt) => (
            <ReceiptCard
              key={receipt.id}
              receipt={receipt}
              onClick={() => receipt.status === 'done' && setSelected(receipt)}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {receipts.length === 0 && (
        <div className="text-center py-20 flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-3xl bg-[#0F172A] border border-[#334155]
                          flex items-center justify-center">
            <IconReceipt className="w-10 h-10 text-[#334155]" />
          </div>
          <div className="space-y-1.5">
            <p className="text-sm font-semibold text-[#94A3B8]">No receipts uploaded yet</p>
            <p className="text-xs text-[#334155]">
              Upload receipt images or PDFs to extract and analyze expenses
            </p>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {selected && selected.status === 'done' && (
        <ReceiptDetailModal receipt={selected} onClose={() => setSelected(null)} />
      )}
    </main>
  )
}
