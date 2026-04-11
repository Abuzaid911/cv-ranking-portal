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
    defaultModel: 'gemini-3.1-flash-lite-preview',
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
