import { useEffect } from 'react'
import type { CVAnalysis } from '../types'

interface Props {
  cv: CVAnalysis
  rank: number
  onClose: () => void
}

const EDUCATION_LABELS: Record<string, string> = {
  none: 'Not specified',
  high_school: 'High School / GED',
  associate: "Associate's Degree",
  bachelor: "Bachelor's Degree",
  master: "Master's Degree",
  phd: 'PhD / Doctorate',
}

function ScoreSection({
  label,
  value,
  max,
  color,
  bg,
  description,
}: {
  label: string
  value: number
  max: number
  color: string
  bg: string
  description: string
}) {
  const pct = Math.round((value / max) * 100)
  return (
    <div className={`rounded-xl p-4 ${bg}`}>
      <div className="flex justify-between items-baseline mb-2">
        <span className="text-sm font-semibold text-gray-300">{label}</span>
        <span className={`text-2xl font-bold ${color}`}>
          {value}
          <span className="text-sm font-normal text-gray-500">/{max}</span>
        </span>
      </div>
      <div className="h-2 bg-black/30 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color.replace('text-', 'bg-')}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 mt-2">{description}</p>
    </div>
  )
}

function totalScoreColor(score: number) {
  if (score >= 85) return 'text-emerald-400'
  if (score >= 70) return 'text-blue-400'
  if (score >= 55) return 'text-amber-400'
  if (score >= 40) return 'text-orange-400'
  return 'text-red-400'
}

function totalScoreLabel(score: number) {
  if (score >= 85) return 'Excellent'
  if (score >= 70) return 'Good'
  if (score >= 55) return 'Average'
  if (score >= 40) return 'Below Average'
  return 'Weak'
}

export default function CVDetailModal({ cv, rank, onClose }: Props) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const scoreCol = totalScoreColor(cv.totalScore)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-gray-950 border border-gray-800 rounded-2xl w-full max-w-6xl h-[90vh]
                      flex flex-col overflow-hidden shadow-2xl">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 shrink-0">
          <div className="flex items-center gap-4">
            <span className="text-2xl">
              {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
            </span>
            <div>
              <h2 className="text-lg font-bold text-gray-100">{cv.candidateName}</h2>
              <p className="text-sm text-gray-500">{cv.currentRole}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className={`text-3xl font-black ${scoreCol}`}>{cv.totalScore}</div>
              <div className={`text-xs font-semibold uppercase tracking-wider ${scoreCol}`}>
                {totalScoreLabel(cv.totalScore)}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-200 hover:bg-gray-800 transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body: PDF viewer + analysis panel */}
        <div className="flex flex-1 min-h-0">
          {/* Left: PDF viewer */}
          <div className="flex-1 bg-gray-900 border-r border-gray-800 flex flex-col">
            <div className="px-4 py-2 border-b border-gray-800 flex items-center gap-2 shrink-0">
              <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
              </svg>
              <span className="text-xs text-gray-500 truncate">{cv.fileName}</span>
            </div>
            <iframe
              src={cv.fileUrl}
              className="flex-1 w-full"
              title={`CV: ${cv.candidateName}`}
            />
          </div>

          {/* Right: Analysis panel */}
          <div className="w-96 flex flex-col overflow-y-auto scrollbar-thin bg-gray-950">
            <div className="p-5 space-y-5">
              {/* Score breakdown */}
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
                  Score Breakdown
                </h3>
                <div className="space-y-2">
                  <ScoreSection
                    label="Experience"
                    value={cv.experienceScore}
                    max={40}
                    color="text-blue-400"
                    bg="bg-blue-500/5 border border-blue-500/10"
                    description={`${cv.yearsOfExperience} year${cv.yearsOfExperience !== 1 ? 's' : ''} of experience`}
                  />
                  <ScoreSection
                    label="Education"
                    value={cv.educationScore}
                    max={30}
                    color="text-purple-400"
                    bg="bg-purple-500/5 border border-purple-500/10"
                    description={EDUCATION_LABELS[cv.educationLevel] ?? cv.highestDegree}
                  />
                  <ScoreSection
                    label="Skills"
                    value={cv.skillsScore}
                    max={30}
                    color="text-emerald-400"
                    bg="bg-emerald-500/5 border border-emerald-500/10"
                    description={`${cv.skills.length} skill${cv.skills.length !== 1 ? 's' : ''} identified`}
                  />
                </div>
              </section>

              {/* Summary */}
              {cv.summary && (
                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                    Summary
                  </h3>
                  <p className="text-sm text-gray-300 leading-relaxed">{cv.summary}</p>
                </section>
              )}

              {/* Key highlights */}
              {cv.keyHighlights.length > 0 && (
                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                    Key Highlights
                  </h3>
                  <ul className="space-y-2">
                    {cv.keyHighlights.map((h, i) => (
                      <li key={i} className="flex gap-2 text-sm text-gray-300">
                        <span className="text-indigo-400 shrink-0 mt-0.5">✦</span>
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Education */}
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                  Education
                </h3>
                <div className="bg-gray-900 rounded-xl p-3">
                  <p className="text-sm font-medium text-gray-200">
                    {cv.highestDegree || EDUCATION_LABELS[cv.educationLevel]}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {EDUCATION_LABELS[cv.educationLevel]}
                  </p>
                </div>
              </section>

              {/* Skills */}
              {cv.skills.length > 0 && (
                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                    Skills ({cv.skills.length})
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {cv.skills.map((skill) => (
                      <span
                        key={skill}
                        className="text-xs px-2.5 py-1 bg-gray-800 text-gray-300 rounded-lg border border-gray-700"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
