import type { CVAnalysis } from '../types'

interface CVCardProps {
  cv: CVAnalysis
  rank: number
  onClick: () => void
}

function ScoreBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.round((value / max) * 100)
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-400">
        <span>{label}</span>
        <span className="font-medium text-gray-300">{value}/{max}</span>
      </div>
      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function scoreColor(score: number) {
  if (score >= 85) return { ring: 'ring-emerald-500', text: 'text-emerald-400', bg: 'bg-emerald-500/10' }
  if (score >= 70) return { ring: 'ring-blue-500', text: 'text-blue-400', bg: 'bg-blue-500/10' }
  if (score >= 55) return { ring: 'ring-amber-500', text: 'text-amber-400', bg: 'bg-amber-500/10' }
  if (score >= 40) return { ring: 'ring-orange-500', text: 'text-orange-400', bg: 'bg-orange-500/10' }
  return { ring: 'ring-red-500', text: 'text-red-400', bg: 'bg-red-500/10' }
}

function rankBadge(rank: number) {
  if (rank === 1) return { emoji: '🥇', cls: 'text-yellow-400 bg-yellow-400/10' }
  if (rank === 2) return { emoji: '🥈', cls: 'text-gray-300 bg-gray-400/10' }
  if (rank === 3) return { emoji: '🥉', cls: 'text-orange-400 bg-orange-400/10' }
  return { emoji: `#${rank}`, cls: 'text-gray-500 bg-gray-700/50' }
}

export default function CVCard({ cv, rank, onClick }: CVCardProps) {
  const colors = scoreColor(cv.totalScore)
  const badge = rankBadge(rank)

  if (cv.status === 'analyzing') {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 animate-pulse">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gray-800 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-800 rounded w-3/4" />
            <div className="h-3 bg-gray-800 rounded w-1/2" />
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-indigo-400">
          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Analyzing with Claude…
        </div>
      </div>
    )
  }

  if (cv.status === 'error') {
    return (
      <div className="bg-gray-900 border border-red-900/50 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="font-medium text-gray-200 text-sm truncate">{cv.fileName}</p>
            <p className="text-xs text-red-400 mt-1">{cv.error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-gray-900 border border-gray-800 hover:border-indigo-500/50
                 rounded-2xl p-5 transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/5
                 hover:-translate-y-0.5 group"
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          {/* Rank badge */}
          <span className={`shrink-0 text-sm font-bold px-2.5 py-1 rounded-lg ${badge.cls}`}>
            {badge.emoji}
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-gray-100 truncate group-hover:text-indigo-300 transition-colors">
              {cv.candidateName}
            </p>
            <p className="text-xs text-gray-500 truncate mt-0.5">{cv.currentRole}</p>
          </div>
        </div>

        {/* Score circle */}
        <div className={`shrink-0 w-14 h-14 rounded-full ring-2 ${colors.ring} ${colors.bg}
                         flex flex-col items-center justify-center`}>
          <span className={`text-lg font-bold leading-none ${colors.text}`}>{cv.totalScore}</span>
          <span className="text-[9px] text-gray-500 uppercase tracking-wide">pts</span>
        </div>
      </div>

      {/* Score bars */}
      <div className="space-y-2 mb-4">
        <ScoreBar label="Experience" value={cv.experienceScore} max={40} color="bg-blue-500" />
        <ScoreBar label="Education" value={cv.educationScore} max={30} color="bg-purple-500" />
        <ScoreBar label="Skills" value={cv.skillsScore} max={30} color="bg-emerald-500" />
      </div>

      {/* Skills tags */}
      {cv.skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {cv.skills.slice(0, 6).map((skill) => (
            <span
              key={skill}
              className="text-[11px] px-2 py-0.5 bg-gray-800 text-gray-400 rounded-md"
            >
              {skill}
            </span>
          ))}
          {cv.skills.length > 6 && (
            <span className="text-[11px] px-2 py-0.5 text-gray-600 rounded-md">
              +{cv.skills.length - 6} more
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-gray-800 flex justify-between items-center">
        <span className="text-xs text-gray-600 truncate">{cv.fileName}</span>
        <span className="text-xs text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
          View details →
        </span>
      </div>
    </button>
  )
}
