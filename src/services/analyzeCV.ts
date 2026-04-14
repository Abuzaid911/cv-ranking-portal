import type { CVAnalysis, EducationLevel, Provider } from '../types'

// ---------------------------------------------------------------------------
// PDF text extraction
// ---------------------------------------------------------------------------
async function extractTextFromPDF(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const pages: string[] = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    pages.push(content.items.map((item) => ('str' in item ? item.str : '')).join(' '))
  }

  const text = pages.join('\n\n').trim()
  if (!text) throw new Error('No readable text found. The PDF may be scanned or image-based.')
  return text
}

// ---------------------------------------------------------------------------
// Shared prompt
// ---------------------------------------------------------------------------
const SYSTEM_PROMPT = `You are an expert HR analyst. Analyze the CV/resume text and return ONLY a valid JSON object — no markdown, no explanation, no code fences.

Score according to these rules:

EXPERIENCE SCORE (0–40 pts):
  0 years: 5 | <1 yr: 10 | 1–2 yrs: 18 | 3–5 yrs: 28 | 6–10 yrs: 35 | 10+ yrs: 40

EDUCATION SCORE (0–30 pts):
  None mentioned: 5 | High School/GED: 10 | Associate/Diploma: 15
  Bachelor's (BSc/BA/BEng): 20 | Master's (MSc/MA/MBA): 26 | PhD/Doctorate: 30

SKILLS SCORE (0–30 pts):
  1–3 skills: 8 | 4–7 skills (limited depth): 15
  8–12 skills (good depth): 22 | 13+ skills (expert breadth): 30

totalScore = experienceScore + educationScore + skillsScore

Return exactly this JSON structure:
{
  "candidateName": "string (or 'Unknown')",
  "currentRole": "string (most recent title or 'Not specified')",
  "yearsOfExperience": number,
  "educationLevel": "none" | "high_school" | "associate" | "bachelor" | "master" | "phd",
  "highestDegree": "string",
  "skills": ["string"],
  "experienceScore": number,
  "educationScore": number,
  "skillsScore": number,
  "totalScore": number,
  "summary": "2–3 sentence professional summary",
  "keyHighlights": ["string", "string", "string"]
}`

function parseJSON(raw: string): object {
  const cleaned = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()
  return JSON.parse(cleaned)
}

// ---------------------------------------------------------------------------
// Provider API calls
// ---------------------------------------------------------------------------
async function callGemini(apiKey: string, cvText: string): Promise<object> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: 'user', parts: [{ text: `Analyze this CV:\n\n${cvText.slice(0, 12000)}` }] }],
      generationConfig: { maxOutputTokens: 4096, temperature: 0.1 },
    }),
  })
  if (!res.ok) {
    const e = await res.json().catch(() => ({}))
    throw new Error((e as { error?: { message?: string } }).error?.message ?? `Gemini error ${res.status}`)
  }
  const data = await res.json() as { candidates: Array<{ content: { parts: Array<{ text: string }> } }> }
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('No text in Gemini response')
  return parseJSON(text)
}

async function callAnthropic(apiKey: string, cvText: string): Promise<object> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-6',
      max_tokens: 4096,
      thinking: { type: 'adaptive' },
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `Analyze this CV:\n\n${cvText.slice(0, 12000)}` }],
    }),
  })
  if (!res.ok) {
    const e = await res.json().catch(() => ({}))
    throw new Error((e as { error?: { message?: string } }).error?.message ?? `Anthropic error ${res.status}`)
  }
  const data = await res.json() as { content: Array<{ type: string; text?: string }> }
  const block = data.content.find((b) => b.type === 'text')
  if (!block?.text) throw new Error('No text in Anthropic response')
  return parseJSON(block.text)
}

async function callOpenAI(apiKey: string, cvText: string, baseUrl = 'https://api.openai.com/v1', model = 'gpt-4o'): Promise<object> {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      temperature: 0.1,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Analyze this CV:\n\n${cvText.slice(0, 12000)}` },
      ],
    }),
  })
  if (!res.ok) {
    const e = await res.json().catch(() => ({}))
    throw new Error((e as { error?: { message?: string } }).error?.message ?? `OpenAI error ${res.status}`)
  }
  const data = await res.json() as { choices: Array<{ message: { content: string } }> }
  const text = data.choices?.[0]?.message?.content
  if (!text) throw new Error('No text in OpenAI response')
  return parseJSON(text)
}

// Copilot = Azure OpenAI — same format, custom endpoint
async function callCopilot(apiKey: string, cvText: string, endpoint: string): Promise<object> {
  if (!endpoint) throw new Error('Azure endpoint URL is required for Copilot')
  // Ensure endpoint ends with the completions path
  const url = endpoint.includes('/chat/completions') ? endpoint : `${endpoint.replace(/\/$/, '')}/chat/completions?api-version=2024-08-01-preview`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify({
      max_tokens: 4096,
      temperature: 0.1,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Analyze this CV:\n\n${cvText.slice(0, 12000)}` },
      ],
    }),
  })
  if (!res.ok) {
    const e = await res.json().catch(() => ({}))
    throw new Error((e as { error?: { message?: string } }).error?.message ?? `Copilot error ${res.status}`)
  }
  const data = await res.json() as { choices: Array<{ message: { content: string } }> }
  const text = data.choices?.[0]?.message?.content
  if (!text) throw new Error('No text in Copilot response')
  return parseJSON(text)
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------
export async function analyzeCV(
  file: File,
  provider: Provider,
  apiKey: string,
  id: string,
  endpoint?: string,
): Promise<CVAnalysis> {
  const fileUrl = URL.createObjectURL(file)

  const base: CVAnalysis = {
    id,
    fileName: file.name,
    fileUrl,
    candidateName: 'Analyzing…',
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
  }

  try {
    const text = await extractTextFromPDF(file)

    let raw: object
    if (provider === 'gemini')    raw = await callGemini(apiKey, text)
    else if (provider === 'anthropic') raw = await callAnthropic(apiKey, text)
    else if (provider === 'openai')    raw = await callOpenAI(apiKey, text)
    else                               raw = await callCopilot(apiKey, text, endpoint ?? '')

    const result = raw as {
      candidateName: string; currentRole: string; yearsOfExperience: number
      educationLevel: EducationLevel; highestDegree: string; skills: string[]
      experienceScore: number; educationScore: number; skillsScore: number
      totalScore: number; summary: string; keyHighlights: string[]
    }

    return {
      ...base,
      candidateName: result.candidateName ?? 'Unknown',
      currentRole: result.currentRole ?? 'Not specified',
      yearsOfExperience: Number(result.yearsOfExperience) || 0,
      educationLevel: result.educationLevel ?? 'none',
      highestDegree: result.highestDegree ?? 'Not specified',
      skills: Array.isArray(result.skills) ? result.skills : [],
      experienceScore: Number(result.experienceScore) || 0,
      educationScore: Number(result.educationScore) || 0,
      skillsScore: Number(result.skillsScore) || 0,
      totalScore: Number(result.totalScore) || 0,
      summary: result.summary ?? '',
      keyHighlights: Array.isArray(result.keyHighlights) ? result.keyHighlights : [],
      status: 'done',
    }
  } catch (err) {
    return {
      ...base,
      candidateName: file.name.replace(/\.pdf$/i, ''),
      status: 'error',
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}
