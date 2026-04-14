import type { ReceiptAnalysis } from '../types'
import { IconSpinner, IconWarning, IconCalendar, IconTag, IconCreditCard, IconFlag, IconChevronRight } from './Icons'

interface Props {
  receipt: ReceiptAnalysis
  onClick: () => void
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

function formatTotal(amount: number, currency: string): string {
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
      month: 'short', day: 'numeric', year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ReceiptCard({ receipt, onClick }: Props) {
  const catStyle = getCategoryStyle(receipt.category)

  /* ── Analyzing skeleton ── */
  if (receipt.status === 'analyzing') {
    return (
      <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-[#0F172A] rounded-full w-2/3 animate-pulse" />
            <div className="h-3 bg-[#0F172A] rounded-full w-1/3 animate-pulse" />
          </div>
          <div className="w-16 h-8 bg-[#0F172A] rounded-xl animate-pulse" />
        </div>
        <div className="flex items-center gap-2 text-sm text-[#0EA5E9]">
          <IconSpinner className="w-4 h-4 shrink-0" />
          <span className="font-medium">Analyzing receipt…</span>
        </div>
        <div className="space-y-2">
          {[80, 55, 70].map((w, i) => (
            <div key={i} className="h-3 bg-[#0F172A] rounded-full animate-pulse" style={{ width: `${w}%` }} />
          ))}
        </div>
      </div>
    )
  }

  /* ── Error state ── */
  if (receipt.status === 'error') {
    return (
      <div className="bg-[#1E293B] border border-red-900/40 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center">
            <IconWarning className="w-4 h-4 text-red-400" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-[#F8FAFC] text-sm truncate">{receipt.fileName}</p>
            <p className="text-xs text-red-400 mt-1 leading-relaxed">{receipt.error}</p>
          </div>
        </div>
      </div>
    )
  }

  /* ── Done card ── */
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-[#1E293B] border border-[#334155]
                 hover:border-[#0EA5E9]/50 rounded-2xl p-5
                 transition-all duration-200 ease-out
                 hover:shadow-lg hover:shadow-[#0EA5E9]/8 hover:-translate-y-0.5
                 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/50
                 group cursor-pointer"
    >
      {/* Header: merchant + category */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <p className="font-bold text-[#F8FAFC] truncate group-hover:text-[#0EA5E9] transition-colors duration-200 text-base">
            {receipt.merchantName}
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5
                              rounded-full border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}>
              <IconTag className="w-3 h-3" />
              {receipt.category}
            </span>
          </div>
        </div>

        {/* Total amount */}
        <div className="shrink-0 text-right">
          <p className="text-xl font-black text-[#22C55E] leading-none">
            {formatTotal(receipt.total, receipt.currency)}
          </p>
          {receipt.currency !== 'USD' && (
            <p className="text-[10px] text-[#94A3B8] mt-0.5">{receipt.currency}</p>
          )}
        </div>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-3 text-xs text-[#94A3B8] mb-3 flex-wrap">
        {receipt.date && (
          <span className="flex items-center gap-1">
            <IconCalendar className="w-3.5 h-3.5 shrink-0" />
            {formatDate(receipt.date)}
          </span>
        )}
        {receipt.paymentMethod && (
          <span className="flex items-center gap-1">
            <IconCreditCard className="w-3.5 h-3.5 shrink-0" />
            {receipt.paymentMethod}
            {receipt.cardLast4 && <span className="text-[#94A3B8]/60"> ···{receipt.cardLast4}</span>}
          </span>
        )}
        {receipt.lineItems.length > 0 && (
          <span className="text-[#94A3B8]/60">
            {receipt.lineItems.length} item{receipt.lineItems.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Financial mini breakdown */}
      {(receipt.tax > 0 || receipt.tip > 0 || receipt.discount > 0) && (
        <div className="flex gap-2 mb-3 text-[11px]">
          {receipt.tax > 0 && (
            <span className="px-2 py-0.5 bg-[#0F172A] text-[#94A3B8] rounded-md border border-[#334155]">
              Tax {formatTotal(receipt.tax, receipt.currency)}
            </span>
          )}
          {receipt.tip > 0 && (
            <span className="px-2 py-0.5 bg-[#0F172A] text-[#94A3B8] rounded-md border border-[#334155]">
              Tip {formatTotal(receipt.tip, receipt.currency)}
            </span>
          )}
          {receipt.discount > 0 && (
            <span className="px-2 py-0.5 bg-[#22C55E]/10 text-[#22C55E] rounded-md border border-[#22C55E]/20">
              −{formatTotal(receipt.discount, receipt.currency)} saved
            </span>
          )}
        </div>
      )}

      {/* Flags warning */}
      {receipt.flags.length > 0 && (
        <div className="flex items-center gap-1.5 mb-3 text-xs text-amber-400">
          <IconFlag className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{receipt.flags[0]}</span>
          {receipt.flags.length > 1 && (
            <span className="shrink-0 text-amber-400/60">+{receipt.flags.length - 1}</span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="pt-3 border-t border-[#334155] flex justify-between items-center">
        <span className="text-xs text-[#94A3B8]/50 truncate">{receipt.fileName}</span>
        <span className="flex items-center gap-1 text-xs text-[#0EA5E9]
                         opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0 ml-2">
          View
          <IconChevronRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </button>
  )
}
