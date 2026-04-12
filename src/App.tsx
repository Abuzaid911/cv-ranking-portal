import { useState, useCallback } from 'react'
import type { CVAnalysis, Provider } from './types'
import { PROVIDERS } from './types'
import { analyzeCV } from './services/analyzeCV'
import UploadZone from './components/UploadZone'
import CVCard from './components/CVCard'
import CVDetailModal from './components/CVDetailModal'
import {
  IconKey, IconEye, IconEyeOff, IconSpinner, IconDocument,
  IconClipboard, IconWarning, IconX,
} from './components/Icons'

// ─── Config Banner ────────────────────────────────────────────────────────────
function ConfigBanner({
  provider, onProvider,
  apiKey, onApiKey,
  endpoint, onEndpoint,
}: {
  provider: Provider; onProvider: (p: Provider) => void
  apiKey: string; onApiKey: (k: string) => void
  endpoint: string; onEndpoint: (e: string) => void
}) {
  const [showKey, setShowKey] = useState(false)
  const cfg = PROVIDERS.find((p) => p.id === provider)!

  return (
    <div className="bg-[#0F172A] border-b border-[#334155]">
      {/* Provider tabs */}
      <div className="flex items-center gap-3 px-6 pt-3 pb-2">
        <span className="text-xs text-[#94A3B8] shrink-0 font-medium">Model</span>
        <div className="flex gap-1 bg-[#020817] rounded-xl p-1 border border-[#334155]">
          {PROVIDERS.map((p) => (
            <button
              key={p.id}
              onClick={() => onProvider(p.id)}
              className={[
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer',
                provider === p.id
                  ? 'bg-[#1E293B] text-[#F8FAFC] shadow-sm border border-[#334155]'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]',
              ].join(' ')}
            >
              <span className={provider === p.id ? p.color : ''}>{p.icon}</span>
              {' '}{p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Key row */}
      <div className="flex items-center gap-3 px-6 pb-3 flex-wrap">
        <IconKey className="w-4 h-4 text-[#94A3B8] shrink-0" />

        {/* API key input */}
        <div className="relative w-72">
          <input
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => onApiKey(e.target.value)}
            placeholder={cfg.keyPlaceholder}
            className="w-full bg-[#020817] border border-[#334155] rounded-xl px-3 py-1.5 pr-9
                       text-xs text-[#F8FAFC] placeholder-[#94A3B8]/50
                       focus:outline-none focus:ring-1 focus:ring-[#0EA5E9] focus:border-[#0EA5E9]
                       transition-colors duration-150"
          />
          <button
            type="button"
            onClick={() => setShowKey((s) => !s)}
            tabIndex={-1}
            aria-label={showKey ? 'Hide API key' : 'Show API key'}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8]
                       hover:text-[#F8FAFC] transition-colors duration-150 cursor-pointer"
          >
            {showKey ? <IconEyeOff className="w-3.5 h-3.5" /> : <IconEye className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Azure endpoint for Copilot */}
        {cfg.requiresEndpoint && (
          <input
            type="text"
            value={endpoint}
            onChange={(e) => onEndpoint(e.target.value)}
            placeholder="https://your-resource.openai.azure.com/openai/deployments/gpt-4o"
            className="flex-1 min-w-[260px] bg-[#020817] border border-[#334155] rounded-xl px-3 py-1.5
                       text-xs text-[#F8FAFC] placeholder-[#94A3B8]/50
                       focus:outline-none focus:ring-1 focus:ring-[#0EA5E9] focus:border-[#0EA5E9]
                       transition-colors duration-150"
          />
        )}

        {/* Status indicator */}
        {!apiKey ? (
          <span className="flex items-center gap-1.5 text-xs text-amber-400">
            <IconWarning className="w-3.5 h-3.5" />
            Enter your API key to start analyzing
          </span>
        ) : (
          <span className={`text-xs font-semibold ${cfg.color}`}>
            ✓ {cfg.name} ready
          </span>
        )}
      </div>
    </div>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────
let idCounter = 0

function storageKey(provider: Provider) { return `cv_apikey_${provider}` }

export default function App() {
  const [provider, setProvider] = useState<Provider>('gemini')
  const [apiKey, setApiKey] = useState(() => sessionStorage.getItem(storageKey('gemini')) ?? '')
  const [endpoint, setEndpoint] = useState(() => sessionStorage.getItem('cv_endpoint') ?? '')
  const [cvs, setCvs] = useState<CVAnalysis[]>([])
  const [selected, setSelected] = useState<CVAnalysis | null>(null)

  const handleProvider = useCallback((p: Provider) => {
    setProvider(p)
    setApiKey(sessionStorage.getItem(storageKey(p)) ?? '')
  }, [])

  const handleApiKey = useCallback((key: string, prov: Provider) => {
    setApiKey(key)
    if (key) sessionStorage.setItem(storageKey(prov), key)
    else sessionStorage.removeItem(storageKey(prov))
  }, [])

  const handleEndpoint = useCallback((e: string) => {
    setEndpoint(e)
    if (e) sessionStorage.setItem('cv_endpoint', e)
    else sessionStorage.removeItem('cv_endpoint')
  }, [])

  const handleFiles = useCallback(async (files: File[]) => {
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

    const currentProvider = provider
    const currentKey = apiKey
    const currentEndpoint = endpoint

    const results = await Promise.all(
      files.map((file, i) => analyzeCV(file, currentProvider, currentKey, newCvs[i].id, currentEndpoint)),
    )

    setCvs((prev) => {
      const byId = new Map(results.map((r) => [r.id, r]))
      return prev.map((cv) => byId.get(cv.id) ?? cv)
    })
  }, [apiKey, provider, endpoint])

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

  const doneCvs = sorted.filter((c) => c.status === 'done')
  const analyzingCount = cvs.filter((c) => c.status === 'analyzing').length
  const rankOf = (cv: CVAnalysis) => doneCvs.findIndex((c) => c.id === cv.id) + 1
  const cfg = PROVIDERS.find((p) => p.id === provider)!

  return (
    <div className="min-h-screen flex flex-col bg-[#020817]">

      {/* ── Header ── */}
      <header className="bg-[#0F172A] border-b border-[#334155] px-6 py-4
                         flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#0EA5E9]/15 border border-[#0EA5E9]/25
                          flex items-center justify-center glow-accent-sm">
            <IconClipboard className="w-5 h-5 text-[#0EA5E9]" />
          </div>
          <div>
            <h1 className="text-base font-bold text-[#F8FAFC] leading-tight">CV Ranking Portal</h1>
            <p className={`text-xs font-semibold ${cfg.color}`}>
              {cfg.icon} {cfg.name}
            </p>
          </div>
        </div>

        {cvs.length > 0 && (
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 text-xs text-[#94A3B8] hover:text-red-400
                       transition-colors duration-150 px-3 py-1.5 border border-[#334155]
                       hover:border-red-900/50 rounded-xl cursor-pointer"
          >
            <IconX className="w-3.5 h-3.5" />
            Clear all
          </button>
        )}
      </header>

      {/* ── Config Banner ── */}
      <ConfigBanner
        provider={provider} onProvider={handleProvider}
        apiKey={apiKey} onApiKey={(k) => handleApiKey(k, provider)}
        endpoint={endpoint} onEndpoint={handleEndpoint}
      />

      {/* ── Main content ── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 space-y-6">

        <UploadZone onFiles={handleFiles} disabled={!apiKey} />

        {/* Analyzing progress */}
        {analyzingCount > 0 && (
          <div className="flex items-center gap-3 text-sm text-[#0EA5E9]
                          bg-[#0EA5E9]/8 border border-[#0EA5E9]/20 rounded-xl px-4 py-3">
            <IconSpinner className="w-4 h-4 shrink-0" />
            <span>
              Analyzing{' '}
              <span className="font-bold">{analyzingCount}</span>
              {' '}CV{analyzingCount > 1 ? 's' : ''} with{' '}
              <span className="font-bold">{cfg.name}</span>…
              <span className="text-[#94A3B8] ml-1.5">You can upload more while waiting.</span>
            </span>
          </div>
        )}

        {/* Stats bar */}
        {doneCvs.length > 0 && (
          <div className="flex items-center gap-4 text-sm flex-wrap">
            <div className="flex items-center gap-2 bg-[#0F172A] border border-[#334155]
                            rounded-xl px-4 py-2">
              <IconDocument className="w-4 h-4 text-[#94A3B8]" />
              <span className="text-[#94A3B8]">
                <span className="font-bold text-[#F8FAFC]">{doneCvs.length}</span>
                {' '}CV{doneCvs.length !== 1 ? 's' : ''} ranked
              </span>
            </div>
            <div className="flex items-center gap-2 bg-[#0F172A] border border-[#334155]
                            rounded-xl px-4 py-2">
              <span className="text-[#94A3B8]">Top score</span>
              <span className="font-bold text-[#22C55E]">{doneCvs[0]?.totalScore}/100</span>
            </div>
            <div className="flex items-center gap-2 bg-[#0F172A] border border-[#334155]
                            rounded-xl px-4 py-2">
              <span className="text-[#94A3B8]">Average</span>
              <span className="font-bold text-[#0EA5E9]">
                {Math.round(doneCvs.reduce((s, c) => s + c.totalScore, 0) / doneCvs.length)}/100
              </span>
            </div>
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
              <p className="text-xs text-[#334155]">
                Upload one or more PDF files above to get started
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Detail modal */}
      {selected && selected.status === 'done' && (
        <CVDetailModal cv={selected} rank={rankOf(selected)} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
