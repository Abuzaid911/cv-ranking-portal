import { useEffect } from 'react'
import type { ReceiptAnalysis } from '../types'
import {
  IconX, IconStore, IconCalendar, IconTag, IconFlag,
  IconCreditCard, IconCurrencyDollar, IconPhoto, IconDocument,
} from './Icons'

interface Props {
  receipt: ReceiptAnalysis
  onClose: () => void
}

// ─── Category styling ─────────────────────────────────────────────────────────
const CATEGORY_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  'Food & Dining':      { bg: 'bg-orange-500/10',  text: 'text-orange-400',  border: 'border-orange-500/20' },
  'Travel & Transport': { bg: 'bg-sky-500/10',      text: 'text-sky-400',     border: 'border-sky-500/20' },
  'Shopping':           { bg: 'bg-purple-500/10',   text: 'text-purple-400',  border: 'border-purple-500/20' },
  'Utilities':          { bg: 'bg-yellow-500/10',   text: 'text-yellow-400',  border: 'border-yellow-500/20' },
  'Healthcare':         { bg: 'bg-emerald-500/10',  text: 'text-emerald-400', border: 'border-emerald-500/20' },
  'Entertainment':      { bg: 'bg-pink-500/10',     text: 'text-pink-400',    border: 'border-pink-500/20' },
  'Office & Business':  { bg: 'bg-slate-500/10',    text: 'text-slate-300',   border: 'border-slate-500/20' },
  'Groceries':          { bg: 'bg-teal-500/10',     text: 'text-teal-400',    border: 'border-teal-500/20' },
  'Fuel':               { bg: 'bg-amber-500/10',    text: 'text-amber-400',   border: 'border-amber-500/20' },
  'Other':              { bg: 'bg-[#334155]/40',    text: 'text-[#94A3B8]',   border: 'border-[#334155]' },
}

function getCategoryStyle(cat: string) {
  return CATEGORY_STYLE[cat] ?? CATEGORY_STYLE['Other']
}

function fmt(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
  } catch {
    return `${currency} ${amount.toFixed(2)}`
  }
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  try {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'short', month: 'long', day: 'numeric', year: 'numeric',
    })
  } catch { return dateStr }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#94A3B8] mb-3">
      {children}
    </h3>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  if (!value) return null
  return (
    <div className="flex items-start justify-between gap-4 text-sm py-2 border-b border-[#334155]/50 last:border-0">
      <span className="text-[#94A3B8] shrink-0">{label}</span>
      <span className="text-[#F8FAFC] text-right font-medium">{value}</span>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ReceiptDetailModal({ receipt, onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const catStyle = getCategoryStyle(receipt.category)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-[#0F172A] border border-[#334155] rounded-2xl w-full max-w-6xl h-[90vh]
                      flex flex-col overflow-hidden shadow-2xl shadow-black/60">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#334155] shrink-0 bg-[#0F172A]">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`shrink-0 w-10 h-10 rounded-xl ${catStyle.bg} border ${catStyle.border}
                             flex items-center justify-center`}>
              <IconStore className={`w-5 h-5 ${catStyle.text}`} />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-[#F8FAFC] truncate">{receipt.merchantName}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5
                                  rounded-full border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}>
                  <IconTag className="w-3 h-3" />
                  {receipt.category}
                </span>
                {receipt.date && (
                  <span className="flex items-center gap-1 text-xs text-[#94A3B8]">
                    <IconCalendar className="w-3 h-3" />
                    {formatDate(receipt.date)}
                    {receipt.time && ` · ${receipt.time}`}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-5 shrink-0">
            <div className="text-right">
              <div className="text-3xl font-black text-[#22C55E] leading-none">
                {fmt(receipt.total, receipt.currency)}
              </div>
              <div className="text-[10px] text-[#94A3B8] mt-0.5 uppercase tracking-widest font-medium">
                {receipt.currency} · Total
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B]
                         transition-colors duration-150 cursor-pointer"
              aria-label="Close modal"
            >
              <IconX className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex flex-1 min-h-0">

          {/* Left: Receipt preview */}
          <div className="flex-1 bg-[#020817] border-r border-[#334155] flex flex-col">
            <div className="px-4 py-2.5 border-b border-[#334155] flex items-center gap-2.5 shrink-0 bg-[#0F172A]">
              {receipt.fileType === 'image'
                ? <IconPhoto className="w-4 h-4 text-[#0EA5E9] shrink-0" />
                : <IconDocument className="w-4 h-4 text-[#0EA5E9] shrink-0" />
              }
              <span className="text-xs text-[#94A3B8] truncate">{receipt.fileName}</span>
            </div>
            {receipt.fileType === 'image' ? (
              <div className="flex-1 overflow-auto flex items-center justify-center bg-[#020817] p-4">
                <img
                  src={receipt.fileUrl}
                  alt={`Receipt from ${receipt.merchantName}`}
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
              </div>
            ) : (
              <iframe
                src={receipt.fileUrl}
                className="flex-1 w-full"
                title={`Receipt: ${receipt.merchantName}`}
              />
            )}
          </div>

          {/* Right: Analysis panel */}
          <div className="w-[420px] flex flex-col overflow-y-auto scrollbar-thin bg-[#0F172A]">
            <div className="p-5 space-y-6">

              {/* ── Financial Summary ── */}
              <section>
                <SectionTitle>Financial Summary</SectionTitle>
                <div className="bg-[#1E293B] border border-[#334155] rounded-xl overflow-hidden">
                  {receipt.subtotal > 0 && (
                    <div className="flex justify-between items-center px-4 py-2.5 text-sm border-b border-[#334155]">
                      <span className="text-[#94A3B8]">Subtotal</span>
                      <span className="text-[#CBD5E1] font-medium">{fmt(receipt.subtotal, receipt.currency)}</span>
                    </div>
                  )}
                  {receipt.tax > 0 && (
                    <div className="flex justify-between items-center px-4 py-2.5 text-sm border-b border-[#334155]">
                      <span className="text-[#94A3B8]">Tax</span>
                      <span className="text-[#CBD5E1] font-medium">{fmt(receipt.tax, receipt.currency)}</span>
                    </div>
                  )}
                  {receipt.tip > 0 && (
                    <div className="flex justify-between items-center px-4 py-2.5 text-sm border-b border-[#334155]">
                      <span className="text-[#94A3B8]">Tip / Gratuity</span>
                      <span className="text-[#CBD5E1] font-medium">{fmt(receipt.tip, receipt.currency)}</span>
                    </div>
                  )}
                  {receipt.discount > 0 && (
                    <div className="flex justify-between items-center px-4 py-2.5 text-sm border-b border-[#334155]">
                      <span className="text-[#94A3B8]">Discount / Savings</span>
                      <span className="text-[#22C55E] font-medium">−{fmt(receipt.discount, receipt.currency)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center px-4 py-3 bg-[#22C55E]/5">
                    <span className="text-[#F8FAFC] font-bold">Total</span>
                    <span className="text-[#22C55E] font-black text-lg">{fmt(receipt.total, receipt.currency)}</span>
                  </div>
                </div>
              </section>

              {/* ── Line Items ── */}
              {receipt.lineItems.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <SectionTitle>Line Items</SectionTitle>
                    <span className="text-[11px] text-[#0EA5E9] font-semibold bg-[#0EA5E9]/10
                                     px-2 py-0.5 rounded-full border border-[#0EA5E9]/20 -mt-3">
                      {receipt.lineItems.length} item{receipt.lineItems.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="bg-[#1E293B] border border-[#334155] rounded-xl overflow-hidden">
                    <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 px-4 py-2 border-b border-[#334155]
                                    text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">
                      <span>Item</span>
                      <span className="text-right">Qty</span>
                      <span className="text-right">Total</span>
                    </div>
                    {receipt.lineItems.map((item, i) => (
                      <div
                        key={i}
                        className="grid grid-cols-[1fr_auto_auto] gap-x-3 px-4 py-2.5 text-sm
                                   border-b border-[#334155]/60 last:border-0
                                   hover:bg-[#0F172A]/60 transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-[#CBD5E1] truncate">{item.name}</p>
                          {item.quantity > 1 && item.unitPrice > 0 && (
                            <p className="text-[11px] text-[#94A3B8]/60">
                              {fmt(item.unitPrice, receipt.currency)} each
                            </p>
                          )}
                        </div>
                        <span className="text-[#94A3B8] text-right self-center">×{item.quantity}</span>
                        <span className="text-[#F8FAFC] font-semibold text-right self-center">
                          {fmt(item.total, receipt.currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* ── Payment Info ── */}
              {(receipt.paymentMethod || receipt.cardLast4) && (
                <section>
                  <SectionTitle>Payment</SectionTitle>
                  <div className="bg-[#1E293B] border border-[#334155] rounded-xl px-4 py-3
                                  flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#0EA5E9]/10 border border-[#0EA5E9]/20
                                    flex items-center justify-center shrink-0">
                      <IconCreditCard className="w-4 h-4 text-[#0EA5E9]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#F8FAFC]">
                        {receipt.paymentMethod || 'Unknown method'}
                      </p>
                      {receipt.cardLast4 && (
                        <p className="text-xs text-[#94A3B8] mt-0.5">
                          ···· ···· ···· {receipt.cardLast4}
                        </p>
                      )}
                    </div>
                  </div>
                </section>
              )}

              {/* ── Merchant Info ── */}
              {(receipt.merchantAddress || receipt.merchantPhone || receipt.receiptNumber) && (
                <section>
                  <SectionTitle>Merchant Details</SectionTitle>
                  <div className="bg-[#1E293B] border border-[#334155] rounded-xl px-4 py-1">
                    <InfoRow label="Address"   value={receipt.merchantAddress} />
                    <InfoRow label="Phone"     value={receipt.merchantPhone} />
                    <InfoRow label="Receipt #" value={receipt.receiptNumber} />
                  </div>
                </section>
              )}

              {/* ── AI Summary ── */}
              {receipt.summary && (
                <section>
                  <SectionTitle>Summary</SectionTitle>
                  <p className="text-sm text-[#CBD5E1] leading-relaxed">{receipt.summary}</p>
                </section>
              )}

              {/* ── Flags ── */}
              {receipt.flags.length > 0 && (
                <section>
                  <SectionTitle>Observations & Flags</SectionTitle>
                  <ul className="space-y-2">
                    {receipt.flags.map((flag, i) => (
                      <li key={i} className="flex gap-2.5 text-sm">
                        <span className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-amber-400/15
                                         flex items-center justify-center">
                          <IconFlag className="w-3 h-3 text-amber-400" />
                        </span>
                        <span className="text-[#CBD5E1] leading-relaxed">{flag}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* ── Tax & Breakdown Insight ── */}
              {receipt.subtotal > 0 && receipt.total > 0 && (
                <section>
                  <SectionTitle>Breakdown Analysis</SectionTitle>
                  <div className="space-y-2.5">
                    {[
                      { label: 'Subtotal', amount: receipt.subtotal, color: 'bg-[#0EA5E9]' },
                      { label: 'Tax', amount: receipt.tax, color: 'bg-violet-500' },
                      { label: 'Tip', amount: receipt.tip, color: 'bg-amber-400' },
                    ]
                      .filter((r) => r.amount > 0)
                      .map((row) => {
                        const pct = Math.round((row.amount / receipt.total) * 100)
                        return (
                          <div key={row.label} className="space-y-1">
                            <div className="flex justify-between text-xs text-[#94A3B8]">
                              <span>{row.label}</span>
                              <span className="font-semibold text-[#F8FAFC]">
                                {fmt(row.amount, receipt.currency)}{' '}
                                <span className="text-[#94A3B8] font-normal">({pct}%)</span>
                              </span>
                            </div>
                            <div className="h-1.5 bg-[#0F172A] rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-700 ease-out ${row.color}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </section>
              )}

              {/* ── File info ── */}
              <section className="pt-2 border-t border-[#334155]">
                <div className="flex items-center gap-2 text-xs text-[#94A3B8]/50">
                  <IconCurrencyDollar className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{receipt.fileName}</span>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
