import { useState, useCallback } from 'react'
import type { CVAnalysis, Provider } from '../types'
import { PROVIDERS } from '../types'
import { analyzeCV } from '../services/analyzeCV'
import UploadZone from '../components/UploadZone'
import CVCard from '../components/CVCard'
import CVDetailModal from '../components/CVDetailModal'
import { IconSpinner, IconDocument, IconX } from '../components/Icons'

interface Props {
  provider: Provider
  apiKey: string
  endpoint: string
}

let idCounter = 0

export default function CVPage({ provider, apiKey, endpoint }: Props) {
  const [cvs, setCvs] = useState<CVAnalysis[]>([])
  const [selected, setSelected] = useState<CVAnalysis | null>(null)
  const cfg = PROVIDERS.find((p) => p.id === provider)!

  const handleFiles = useCallback(
    async (files: File[]) => {
      if (!apiKey) { alert('Please enter your API key first.'); return }

      const newCvs: CVAnalysis[] = files.map((f) => ({
        id: String(++idCounter),
        fileName: f.name,
        fileUrl: '',
        candidateName: f.name.replace(/\.pdf$/i, ''),
        currentRole: '',
        yearsOfExperience: 0,
        educationLevel: 'none',
        highestDegree: '',
        skills: [],
        experienceScore: 0,
        educationScore: 0,
        skillsScore: 0,
        totalScore: 0,
        summary: '',
        keyHighlights: [],
        status: 'analyzing',
        provider,
      }))

      setCvs((prev) => [...prev, ...newCvs])

      const results = await Promise.all(
        files.map((file, i) => analyzeCV(file, provider, apiKey, newCvs[i].id, endpoint)),
      )

      setCvs((prev) => {
        const byId = new Map(results.map((r) => [r.id, r]))
        return prev.map((cv) => byId.get(cv.id) ?? cv)
      })
    },
    [apiKey, provider, endpoint],
  )

  const handleClear = () => {
    cvs.forEach((cv) => { if (cv.fileUrl) URL.revokeObjectURL(cv.fileUrl) })
    setCvs([])
    setSelected(null)
  }

  const sorted = [...cvs].sort((a, b) => {
    if (a.status === 'done' && b.status === 'done') return b.totalScore - a.totalScore
    if (a.status === 'done') return -1
    if (b.status === 'done') return 1
    return 0
  })

  const doneCvs    = sorted.filter((c) => c.status === 'done')
  const analyzing  = cvs.filter((c) => c.status === 'analyzing').length
  const rankOf     = (cv: CVAnalysis) => doneCvs.findIndex((c) => c.id === cv.id) + 1

  return (
    <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 space-y-6">
      {/* Upload zone */}
      <UploadZone onFiles={handleFiles} disabled={!apiKey} />

      {/* Analyzing progress */}
      {analyzing > 0 && (
        <div className="flex items-center gap-3 text-sm text-[#0EA5E9]
                        bg-[#0EA5E9]/8 border border-[#0EA5E9]/20 rounded-xl px-4 py-3">
          <IconSpinner className="w-4 h-4 shrink-0" />
          <span>
            Analyzing{' '}
            <span className="font-bold">{analyzing}</span>
            {' '}CV{analyzing > 1 ? 's' : ''} with{' '}
            <span className="font-bold">{cfg.name}</span>…
            <span className="text-[#94A3B8] ml-1.5">You can upload more while waiting.</span>
          </span>
        </div>
      )}

      {/* Stats bar */}
      {doneCvs.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-[#0F172A] border border-[#334155] rounded-xl px-4 py-2 text-sm">
            <IconDocument className="w-4 h-4 text-[#94A3B8]" />
            <span className="text-[#94A3B8]">
              <span className="font-bold text-[#F8FAFC]">{doneCvs.length}</span>
              {' '}CV{doneCvs.length !== 1 ? 's' : ''} ranked
            </span>
          </div>
          <div className="flex items-center gap-2 bg-[#0F172A] border border-[#334155] rounded-xl px-4 py-2 text-sm">
            <span className="text-[#94A3B8]">Top score</span>
            <span className="font-bold text-[#22C55E]">{doneCvs[0]?.totalScore}/100</span>
          </div>
          <div className="flex items-center gap-2 bg-[#0F172A] border border-[#334155] rounded-xl px-4 py-2 text-sm">
            <span className="text-[#94A3B8]">Average</span>
            <span className="font-bold text-[#0EA5E9]">
              {Math.round(doneCvs.reduce((s, c) => s + c.totalScore, 0) / doneCvs.length)}/100
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
      )}

      {/* CV grid */}
      {sorted.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sorted.map((cv) => (
            <CVCard
              key={cv.id}
              cv={cv}
              rank={cv.status === 'done' ? rankOf(cv) : 0}
              onClick={() => cv.status === 'done' && setSelected(cv)}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {cvs.length === 0 && (
        <div className="text-center py-20 flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-3xl bg-[#0F172A] border border-[#334155]
                          flex items-center justify-center">
            <IconDocument className="w-10 h-10 text-[#334155]" />
          </div>
          <div className="space-y-1.5">
            <p className="text-sm font-semibold text-[#94A3B8]">No CVs uploaded yet</p>
            <p className="text-xs text-[#334155]">Upload PDF files above to rank candidates by score</p>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {selected && selected.status === 'done' && (
        <CVDetailModal cv={selected} rank={rankOf(selected)} onClose={() => setSelected(null)} />
      )}
    </main>
  )
}
