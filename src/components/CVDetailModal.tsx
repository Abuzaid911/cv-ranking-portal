import { useEffect } from 'react'
import type { CVAnalysis } from '../types'
import { IconX, IconDocument, IconStar, IconClipboard } from './Icons'

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
  barColor,
  bg,
  border,
  textColor,
  description,
}: {
  label: string
  value: number
  max: number
  barColor: string
  bg: string
  border: string
  textColor: string
  description: string
}) {
  const pct = Math.round((value / max) * 100)
  return (
    <div className={`rounded-xl p-4 ${bg} border ${border}`}>
      <div className="flex justify-between items-baseline mb-2.5">
        <span className="text-sm font-semibold text-[#F8FAFC]">{label}</span>
        <span className={`text-2xl font-bold ${textColor}`}>
          {value}
          <span className="text-sm font-normal text-[#94A3B8]">/{max}</span>
        </span>
      </div>
      <div className="h-1.5 bg-black/30 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-[#94A3B8] mt-2">{description}</p>
    </div>
  )
}

function totalScoreTheme(score: number) {
  if (score >= 85) return { color: 'text-[#22C55E]', label: 'Excellent' }
  if (score >= 70) return { color: 'text-[#0EA5E9]', label: 'Good' }
  if (score >= 55) return { color: 'text-amber-400', label: 'Average' }
  if (score >= 40) return { color: 'text-orange-400', label: 'Below Average' }
  return { color: 'text-red-400', label: 'Weak' }
}

function RankLabel({ rank }: { rank: number }) {
  if (rank === 1) return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg
                     text-xs font-bold bg-amber-400/10 text-amber-400 border border-amber-400/20">
      <IconStar className="w-3 h-3" /> 1st Place
    </span>
  )
  if (rank === 2) return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-lg
                     text-xs font-bold bg-slate-400/10 text-slate-300 border border-slate-400/20">
      2nd Place
    </span>
  )
  if (rank === 3) return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-lg
                     text-xs font-bold bg-orange-400/10 text-orange-300 border border-orange-400/20">
      3rd Place
    </span>
  )
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-lg
                     text-xs font-semibold bg-[#0F172A] text-[#94A3B8] border border-[#334155]">
      #{rank}
    </span>
  )
}

export default function CVDetailModal({ cv, rank, onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const { color: scoreColor, label: scoreLabel } = totalScoreTheme(cv.totalScore)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="bg-[#0F172A] border border-[#334155] rounded-2xl w-full max-w-6xl h-[90vh]
                   flex flex-col overflow-hidden shadow-2xl shadow-black/60"
      >
        {/* ── Modal header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#334155] shrink-0
                        bg-[#0F172A]">
          <div className="flex items-center gap-3 min-w-0">
            <RankLabel rank={rank} />
            <div className="min-w-0">
              <h2 className="text-base font-bold text-[#F8FAFC] truncate">{cv.candidateName}</h2>
              <p className="text-xs text-[#94A3B8] truncate mt-0.5">{cv.currentRole}</p>
            </div>
          </div>

          <div className="flex items-center gap-5 shrink-0">
            <div className="text-right">
              <div className={`text-3xl font-black leading-none ${scoreColor}`}>{cv.totalScore}</div>
              <div className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${scoreColor}`}>
                {scoreLabel}
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
          {/* Left: PDF viewer */}
          <div className="flex-1 bg-[#020817] border-r border-[#334155] flex flex-col">
            <div className="px-4 py-2.5 border-b border-[#334155] flex items-center gap-2.5 shrink-0
                            bg-[#0F172A]">
              <IconDocument className="w-4 h-4 text-[#0EA5E9] shrink-0" />
              <span className="text-xs text-[#94A3B8] truncate">{cv.fileName}</span>
            </div>
            <iframe
              src={cv.fileUrl}
              className="flex-1 w-full"
              title={`CV: ${cv.candidateName}`}
            />
          </div>

          {/* Right: Analysis panel */}
          <div className="w-96 flex flex-col overflow-y-auto scrollbar-thin bg-[#0F172A]">
            <div className="p-5 space-y-6">

              {/* Score breakdown */}
              <section>
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#94A3B8] mb-3">
                  Score Breakdown
                </h3>
                <div className="space-y-2">
                  <ScoreSection
                    label="Experience"
                    value={cv.experienceScore}
                    max={40}
                    barColor="bg-[#0EA5E9]"
                    bg="bg-[#0EA5E9]/5"
                    border="border-[#0EA5E9]/15"
                    textColor="text-[#0EA5E9]"
                    description={`${cv.yearsOfExperience} year${cv.yearsOfExperience !== 1 ? 's' : ''} of experience`}
                  />
                  <ScoreSection
                    label="Education"
                    value={cv.educationScore}
                    max={30}
                    barColor="bg-violet-500"
                    bg="bg-violet-500/5"
                    border="border-violet-500/15"
                    textColor="text-violet-400"
                    description={EDUCATION_LABELS[cv.educationLevel] ?? cv.highestDegree}
                  />
                  <ScoreSection
                    label="Skills"
                    value={cv.skillsScore}
                    max={30}
                    barColor="bg-[#22C55E]"
                    bg="bg-[#22C55E]/5"
                    border="border-[#22C55E]/15"
                    textColor="text-[#22C55E]"
                    description={`${cv.skills.length} skill${cv.skills.length !== 1 ? 's' : ''} identified`}
                  />
                </div>
              </section>

              {/* Summary */}
              {cv.summary && (
                <section>
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#94A3B8] mb-3">
                    Summary
                  </h3>
                  <p className="text-sm text-[#CBD5E1] leading-relaxed">{cv.summary}</p>
                </section>
              )}

              {/* Key highlights */}
              {cv.keyHighlights.length > 0 && (
                <section>
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#94A3B8] mb-3">
                    Key Highlights
                  </h3>
                  <ul className="space-y-2.5">
                    {cv.keyHighlights.map((h, i) => (
                      <li key={i} className="flex gap-2.5 text-sm text-[#CBD5E1]">
                        <span className="shrink-0 mt-0.5 w-4 h-4 rounded-full bg-[#0EA5E9]/15
                                         flex items-center justify-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#0EA5E9]" />
                        </span>
                        <span className="leading-relaxed">{h}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Education */}
              <section>
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#94A3B8] mb-3">
                  Education
                </h3>
                <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-3.5">
                  <p className="text-sm font-semibold text-[#F8FAFC]">
                    {cv.highestDegree || EDUCATION_LABELS[cv.educationLevel]}
                  </p>
                  {cv.highestDegree && cv.educationLevel !== 'none' && (
                    <p className="text-xs text-[#94A3B8] mt-1">
                      {EDUCATION_LABELS[cv.educationLevel]}
                    </p>
                  )}
                </div>
              </section>

              {/* Skills */}
              {cv.skills.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#94A3B8]">
                      Skills
                    </h3>
                    <span className="text-[11px] text-[#0EA5E9] font-semibold bg-[#0EA5E9]/10
                                     px-2 py-0.5 rounded-full border border-[#0EA5E9]/20">
                      {cv.skills.length}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {cv.skills.map((skill) => (
                      <span
                        key={skill}
                        className="text-xs px-2.5 py-1 bg-[#1E293B] text-[#CBD5E1]
                                   rounded-lg border border-[#334155] transition-colors duration-150
                                   hover:border-[#0EA5E9]/40 hover:text-[#F8FAFC]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {/* File info */}
              <section className="pt-2 border-t border-[#334155]">
                <div className="flex items-center gap-2 text-xs text-[#94A3B8]/60">
                  <IconClipboard className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{cv.fileName}</span>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
