import { useState, useCallback } from 'react'
import type { CVAnalysis, Provider } from './types'
import { PROVIDERS } from './types'
import { analyzeCV } from './services/analyzeCV'
import UploadZone from './components/UploadZone'
import CVCard from './components/CVCard'
import CVDetailModal from './components/CVDetailModal'

// ─── Provider Selector + API Key Banner ──────────────────────────────────────
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
    <div className="bg-gray-900 border-b border-gray-800">
      {/* Provider tabs */}
      <div className="flex items-center gap-2 px-6 pt-3 pb-2">
        <span className="text-xs text-gray-600 mr-1 shrink-0">Model</span>
        <div className="flex gap-1 bg-gray-800/60 rounded-xl p-1">
          {PROVIDERS.map((p) => (
            <button
              key={p.id}
              onClick={() => onProvider(p.id)}
              className={`
                px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150
                ${provider === p.id
                  ? 'bg-gray-700 text-white shadow'
                  : 'text-gray-500 hover:text-gray-300'}
              `}
            >
              <span className={provider === p.id ? p.color : ''}>{p.icon}</span>
              {' '}{p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Key + optional endpoint */}
      <div className="flex items-center gap-3 px-6 pb-3">
        <svg className="w-4 h-4 text-gray-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>

        {/* API key input */}
        <div className="relative w-72">
          <input
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => onApiKey(e.target.value)}
            placeholder={cfg.keyPlaceholder}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs
                       text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 pr-8"
          />
          <button
            type="button"
            onClick={() => setShowKey((s) => !s)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 text-sm"
            tabIndex={-1}
          >
            {showKey ? '🙈' : '👁'}
          </button>
        </div>

        {/* Azure endpoint for Copilot */}
        {cfg.requiresEndpoint && (
          <input
            type="text"
            value={endpoint}
            onChange={(e) => onEndpoint(e.target.value)}
            placeholder="https://your-resource.openai.azure.com/openai/deployments/gpt-4o"
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs
                       text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        )}

        {/* Status */}
        {!apiKey && (
          <span className="text-xs text-amber-500">Enter your API key to start analyzing</span>
        )}
        {apiKey && (
          <span className={`text-xs font-medium ${cfg.color}`}>
            ✓ {cfg.name} ready
          </span>
        )}
      </div>
    </div>
  )
}

// ─── App ─────────────────────────────────────────────────────────────────────
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

  // Allow uploading at any time — no lock, no disabled state while analyzing
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

    // Capture current values to avoid stale closures
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
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📋</span>
          <div>
            <h1 className="text-lg font-bold text-gray-100">CV Ranking Portal</h1>
            <p className={`text-xs font-medium ${cfg.color}`}>
              {cfg.icon} {cfg.name}
            </p>
          </div>
        </div>
        {cvs.length > 0 && (
          <button
            onClick={handleClear}
            className="text-xs text-gray-600 hover:text-red-400 transition-colors px-3 py-1.5
                       border border-gray-800 hover:border-red-900 rounded-lg"
          >
            Clear all
          </button>
        )}
      </header>

      {/* Config banner */}
      <ConfigBanner
        provider={provider} onProvider={handleProvider}
        apiKey={apiKey} onApiKey={(k) => handleApiKey(k, provider)}
        endpoint={endpoint} onEndpoint={handleEndpoint}
      />

      {/* Main */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 space-y-8">
        <UploadZone onFiles={handleFiles} disabled={!apiKey} />

        {/* Progress */}
        {analyzingCount > 0 && (
          <div className="flex items-center gap-3 text-sm text-indigo-400">
            <svg className="animate-spin w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Analyzing {analyzingCount} CV{analyzingCount > 1 ? 's' : ''} with {cfg.name}… You can upload more while waiting.
          </div>
        )}

        {/* Stats */}
        {doneCvs.length > 0 && (
          <div className="flex items-center gap-6 text-sm flex-wrap">
            <span className="text-gray-500">{doneCvs.length} CV{doneCvs.length > 1 ? 's' : ''} ranked</span>
            <span className="text-gray-700">·</span>
            <span className="text-gray-500">
              Top score: <span className="text-emerald-400 font-semibold">{doneCvs[0]?.totalScore}/100</span>
            </span>
            <span className="text-gray-700">·</span>
            <span className="text-gray-500">
              Avg: <span className="text-blue-400 font-semibold">
                {Math.round(doneCvs.reduce((s, c) => s + c.totalScore, 0) / doneCvs.length)}/100
              </span>
            </span>
          </div>
        )}

        {/* Grid */}
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

        {cvs.length === 0 && (
          <div className="text-center py-16 text-gray-700">
            <p className="text-4xl mb-3">🗂️</p>
            <p className="text-sm">Upload CVs to get started — you can select multiple at once</p>
          </div>
        )}
      </main>

      {selected && selected.status === 'done' && (
        <CVDetailModal cv={selected} rank={rankOf(selected)} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
