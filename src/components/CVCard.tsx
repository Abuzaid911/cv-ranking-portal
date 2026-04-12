import type { CVAnalysis } from '../types'
import { IconSpinner, IconWarning, IconChevronRight, IconStar } from './Icons'

interface CVCardProps {
  cv: CVAnalysis
  rank: number
  onClick: () => void
}

function ScoreBar({
  label,
  value,
  max,
  color,
}: {
  label: string
  value: number
  max: number
  color: string
}) {
  const pct = Math.round((value / max) * 100)
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-[#94A3B8]">
        <span>{label}</span>
        <span className="font-semibold text-[#F8FAFC]">
          {value}<span className="text-[#94A3B8] font-normal">/{max}</span>
        </span>
      </div>
      <div className="h-1.5 bg-[#0F172A] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function scoreTheme(score: number) {
  if (score >= 85) return { ring: 'ring-[#22C55E]', text: 'text-[#22C55E]', bg: 'bg-[#22C55E]/10' }
  if (score >= 70) return { ring: 'ring-[#0EA5E9]', text: 'text-[#0EA5E9]', bg: 'bg-[#0EA5E9]/10' }
  if (score >= 55) return { ring: 'ring-amber-400', text: 'text-amber-400', bg: 'bg-amber-400/10' }
  if (score >= 40) return { ring: 'ring-orange-400', text: 'text-orange-400', bg: 'bg-orange-400/10' }
  return { ring: 'ring-red-500', text: 'text-red-400', bg: 'bg-red-500/10' }
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg
                       text-xs font-bold bg-amber-400/10 text-amber-400 border border-amber-400/20">
        <IconStar className="w-3 h-3" />
        1st
      </span>
    )
  }
  if (rank === 2) {
    return (
      <span className="shrink-0 inline-flex items-center px-2.5 py-1 rounded-lg
                       text-xs font-bold bg-slate-400/10 text-slate-300 border border-slate-400/20">
        2nd
      </span>
    )
  }
  if (rank === 3) {
    return (
      <span className="shrink-0 inline-flex items-center px-2.5 py-1 rounded-lg
                       text-xs font-bold bg-orange-400/10 text-orange-300 border border-orange-400/20">
        3rd
      </span>
    )
  }
  return (
    <span className="shrink-0 inline-flex items-center px-2.5 py-1 rounded-lg
                     text-xs font-semibold bg-[#0F172A] text-[#94A3B8] border border-[#334155]">
      #{rank}
    </span>
  )
}

export default function CVCard({ cv, rank, onClick }: CVCardProps) {
  const theme = scoreTheme(cv.totalScore)

  /* ── Analyzing skeleton ── */
  if (cv.status === 'analyzing') {
    return (
      <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#0F172A] rounded-full animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 bg-[#0F172A] rounded-full w-3/4 animate-pulse" />
            <div className="h-3 bg-[#0F172A] rounded-full w-1/2 animate-pulse" />
          </div>
        </div>
        <div className="flex items-center gap-2.5 text-sm text-[#0EA5E9]">
          <IconSpinner className="w-4 h-4 shrink-0" />
          <span className="font-medium">Analyzing…</span>
        </div>
        <div className="space-y-2.5">
          {[75, 55, 65].map((w, i) => (
            <div key={i} className="space-y-1">
              <div className="h-2.5 bg-[#0F172A] rounded-full animate-pulse" style={{ width: `${w}%` }} />
              <div className="h-1.5 bg-[#0F172A] rounded-full animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  /* ── Error state ── */
  if (cv.status === 'error') {
    return (
      <div className="bg-[#1E293B] border border-red-900/40 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center">
            <IconWarning className="w-4 h-4 text-red-400" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-[#F8FAFC] text-sm truncate">{cv.fileName}</p>
            <p className="text-xs text-red-400 mt-1 leading-relaxed">{cv.error}</p>
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
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <RankBadge rank={rank} />
          <div className="min-w-0">
            <p className="font-semibold text-[#F8FAFC] truncate group-hover:text-[#0EA5E9] transition-colors duration-200">
              {cv.candidateName}
            </p>
            <p className="text-xs text-[#94A3B8] truncate mt-0.5">{cv.currentRole}</p>
          </div>
        </div>

        {/* Score ring */}
        <div className={`shrink-0 w-14 h-14 rounded-full ring-2 ${theme.ring} ${theme.bg}
                         flex flex-col items-center justify-center`}>
          <span className={`text-lg font-bold leading-none ${theme.text}`}>{cv.totalScore}</span>
          <span className="text-[9px] text-[#94A3B8] uppercase tracking-wide font-medium">pts</span>
        </div>
      </div>

      {/* Score bars */}
      <div className="space-y-2.5 mb-4">
        <ScoreBar label="Experience" value={cv.experienceScore} max={40} color="bg-[#0EA5E9]" />
        <ScoreBar label="Education"  value={cv.educationScore}  max={30} color="bg-violet-500" />
        <ScoreBar label="Skills"     value={cv.skillsScore}     max={30} color="bg-[#22C55E]" />
      </div>

      {/* Skill tags */}
      {cv.skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {cv.skills.slice(0, 5).map((skill) => (
            <span
              key={skill}
              className="text-[11px] px-2 py-0.5 bg-[#0F172A] text-[#94A3B8]
                         rounded-md border border-[#334155]"
            >
              {skill}
            </span>
          ))}
          {cv.skills.length > 5 && (
            <span className="text-[11px] px-2 py-0.5 text-[#94A3B8]/60 rounded-md">
              +{cv.skills.length - 5}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="pt-3 border-t border-[#334155] flex justify-between items-center">
        <span className="text-xs text-[#94A3B8]/60 truncate">{cv.fileName}</span>
        <span className="flex items-center gap-1 text-xs text-[#0EA5E9]
                         opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0 ml-2">
          View
          <IconChevronRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </button>
  )
}
