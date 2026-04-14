import { useState, useCallback } from 'react'
import type { Provider } from './types'
import { PROVIDERS } from './types'
import CVPage from './pages/CVPage'
import ReceiptsPage from './pages/ReceiptsPage'
import { IconKey, IconEye, IconEyeOff, IconWarning, IconDocument, IconReceipt } from './components/Icons'

type AppTab = 'cv' | 'receipts'

// ─── Config Banner (shared across tabs) ───────────────────────────────────────
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
        <span className="text-xs text-[#94A3B8] shrink-0 font-medium">AI Model</span>
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
function storageKey(provider: Provider) { return `cv_apikey_${provider}` }

const TABS = [
  {
    id: 'cv' as AppTab,
    label: 'CV Analyzer',
    icon: IconDocument,
    description: 'Rank candidates by score',
    accent: '#0EA5E9',
  },
  {
    id: 'receipts' as AppTab,
    label: 'Receipt Analyzer',
    icon: IconReceipt,
    description: 'Extract & analyze expenses',
    accent: '#22C55E',
  },
]

export default function App() {
  const [tab, setTab] = useState<AppTab>('cv')
  const [provider, setProvider] = useState<Provider>('gemini')
  const [apiKey, setApiKey] = useState(() => sessionStorage.getItem(storageKey('gemini')) ?? '')
  const [endpoint, setEndpoint] = useState(() => sessionStorage.getItem('cv_endpoint') ?? '')

  const handleProvider = useCallback((p: Provider) => {
    setProvider(p)
    setApiKey(sessionStorage.getItem(storageKey(p)) ?? '')
  }, [])

  const handleApiKey = useCallback((key: string) => {
    setApiKey(key)
    if (key) sessionStorage.setItem(storageKey(provider), key)
    else sessionStorage.removeItem(storageKey(provider))
  }, [provider])

  const handleEndpoint = useCallback((e: string) => {
    setEndpoint(e)
    if (e) sessionStorage.setItem('cv_endpoint', e)
    else sessionStorage.removeItem('cv_endpoint')
  }, [])

  const activeTab = TABS.find((t) => t.id === tab)!

  return (
    <div className="min-h-screen flex flex-col bg-[#020817]">

      {/* ── Header ── */}
      <header className="bg-[#0F172A] border-b border-[#334155] px-6 py-3 shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">

          {/* Logo + title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0EA5E9]/15 border border-[#0EA5E9]/25
                            flex items-center justify-center glow-accent-sm">
              <activeTab.icon className="w-5 h-5 text-[#0EA5E9]" />
            </div>
            <div>
              <h1 className="text-base font-bold text-[#F8FAFC] leading-tight">Analysis Portal</h1>
              <p className="text-[11px] text-[#94A3B8]">{activeTab.description}</p>
            </div>
          </div>

          {/* Tab switcher */}
          <nav className="flex items-center gap-1 bg-[#020817] rounded-xl p-1 border border-[#334155]">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={[
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold',
                  'transition-all duration-200 ease-out cursor-pointer',
                  tab === t.id
                    ? 'bg-[#1E293B] text-[#F8FAFC] shadow-sm border border-[#334155]'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC]',
                ].join(' ')}
              >
                <t.icon
                  className={[
                    'w-4 h-4 transition-colors',
                    tab === t.id
                      ? t.id === 'cv' ? 'text-[#0EA5E9]' : 'text-[#22C55E]'
                      : 'text-[#94A3B8]',
                  ].join(' ')}
                />
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* ── Config Banner (shared) ── */}
      <ConfigBanner
        provider={provider}   onProvider={handleProvider}
        apiKey={apiKey}       onApiKey={handleApiKey}
        endpoint={endpoint}   onEndpoint={handleEndpoint}
      />

      {/* ── Tab content ── */}
      <div className="flex flex-1 flex-col">
        {tab === 'cv' ? (
          <CVPage provider={provider} apiKey={apiKey} endpoint={endpoint} />
        ) : (
          <ReceiptsPage provider={provider} apiKey={apiKey} endpoint={endpoint} />
        )}
      </div>
    </div>
  )
}
