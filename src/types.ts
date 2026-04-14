export type CVStatus = 'analyzing' | 'done' | 'error'

export type EducationLevel = 'none' | 'high_school' | 'associate' | 'bachelor' | 'master' | 'phd'

export type Provider = 'gemini' | 'anthropic' | 'openai' | 'copilot'

export interface ProviderConfig {
  id: Provider
  name: string
  icon: string
  color: string
  keyPlaceholder: string
  defaultModel: string
  requiresEndpoint?: boolean
}

export const PROVIDERS: ProviderConfig[] = [
  {
    id: 'gemini',
    name: 'Gemini',
    icon: '✦',
    color: 'text-blue-400',
    keyPlaceholder: 'AIzaSy…',
    defaultModel: 'gemini-3-flash-preview',
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    icon: '◈',
    color: 'text-orange-400',
    keyPlaceholder: 'sk-ant-…',
    defaultModel: 'claude-opus-4-6',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    icon: '⬡',
    color: 'text-emerald-400',
    keyPlaceholder: 'sk-proj-…',
    defaultModel: 'gpt-4o',
  },
  {
    id: 'copilot',
    name: 'Copilot',
    icon: '⬡',
    color: 'text-indigo-400',
    keyPlaceholder: 'Azure API key…',
    defaultModel: 'gpt-4o',
    requiresEndpoint: true,
  },
]

// ─── CV Types ─────────────────────────────────────────────────────────────────

export interface CVAnalysis {
  id: string
  fileName: string
  fileUrl: string
  candidateName: string
  currentRole: string
  yearsOfExperience: number
  educationLevel: EducationLevel
  highestDegree: string
  skills: string[]
  experienceScore: number  // 0–40
  educationScore: number   // 0–30
  skillsScore: number      // 0–30
  totalScore: number       // 0–100
  summary: string
  keyHighlights: string[]
  status: CVStatus
  provider?: Provider
  error?: string
}

// ─── Receipt Types ────────────────────────────────────────────────────────────

export interface ReceiptLineItem {
  name: string
  quantity: number
  unitPrice: number
  total: number
}

export type ReceiptStatus = 'analyzing' | 'done' | 'error'

export interface ReceiptAnalysis {
  id: string
  fileName: string
  fileUrl: string
  fileType: 'image' | 'pdf'
  status: ReceiptStatus
  error?: string
  provider: Provider
  // Merchant
  merchantName: string
  merchantAddress: string
  merchantPhone: string
  // Transaction
  date: string        // YYYY-MM-DD
  time: string        // HH:MM
  receiptNumber: string
  // Financials
  currency: string    // ISO 4217 e.g. USD
  subtotal: number
  tax: number
  tip: number
  discount: number
  total: number
  // Payment
  paymentMethod: string
  cardLast4: string
  // Classification
  category: string
  // Details
  lineItems: ReceiptLineItem[]
  flags: string[]
  summary: string
}
