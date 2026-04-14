import type { ReceiptAnalysis, ReceiptLineItem, Provider } from '../types'

// ─── Input payload union ──────────────────────────────────────────────────────
type InputPayload =
  | { kind: 'image'; data: string; mimeType: string }
  | { kind: 'text'; content: string }

// ─── File helpers ─────────────────────────────────────────────────────────────

function isImageFile(file: File): boolean {
  return (
    file.type.startsWith('image/') ||
    /\.(jpg|jpeg|png|webp|heic|gif|bmp|tiff)$/i.test(file.name)
  )
}

async function fileToBase64(file: File): Promise<{ data: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve({ data: result.split(',')[1], mimeType: file.type || 'image/jpeg' })
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function getPdfLib() {
  const lib = await import('pdfjs-dist')
  lib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${lib.version}/pdf.worker.min.mjs`
  return lib
}

async function extractPdfText(file: File): Promise<string> {
  const lib = await getPdfLib()
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await lib.getDocument({ data: arrayBuffer }).promise
  const pages: string[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    pages.push(content.items.map((item) => ('str' in item ? item.str : '')).join(' '))
  }
  return pages.join('\n\n').trim()
}

/** Renders the first PDF page to a JPEG base64 (for scanned / image-only PDFs). */
async function pdfPageToImage(file: File): Promise<{ data: string; mimeType: string }> {
  const lib = await getPdfLib()
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await lib.getDocument({ data: arrayBuffer }).promise
  const page = await pdf.getPage(1)
  const viewport = page.getViewport({ scale: 2.0 })
  const canvas = document.createElement('canvas')
  canvas.width = viewport.width
  canvas.height = viewport.height
  const ctx = canvas.getContext('2d')!
  await page.render({ canvasContext: ctx, viewport }).promise
  const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
  return { data: dataUrl.split(',')[1], mimeType: 'image/jpeg' }
}

/**
 * Resolves the best input for AI analysis:
 * - Image files → base64
 * - Text PDFs (≥80 chars extracted) → plain text
 * - Scanned PDFs (<80 chars) → render page 1 as JPEG
 */
async function prepareInput(file: File): Promise<InputPayload> {
  if (isImageFile(file)) {
    const img = await fileToBase64(file)
    return { kind: 'image', ...img }
  }
  try {
    const text = await extractPdfText(file)
    if (text.length >= 80) return { kind: 'text', content: text }
    // Scanned PDF – fall through to image
  } catch {
    // Extraction failed – fall through to image
  }
  const img = await pdfPageToImage(file)
  return { kind: 'image', ...img }
}

// ─── Shared prompt ────────────────────────────────────────────────────────────

const RECEIPT_PROMPT = `You are an expert receipt and invoice analyst with deep knowledge of accounting, retail, and expense management.

Analyze the provided receipt carefully and extract ALL information with precision.

Return ONLY a valid JSON object — no markdown fences, no commentary — with EXACTLY this structure:
{
  "merchantName": "exact business name or Unknown",
  "merchantAddress": "full address or empty string",
  "merchantPhone": "phone number or empty string",
  "date": "YYYY-MM-DD or empty string",
  "time": "HH:MM 24h or empty string",
  "receiptNumber": "receipt/order/invoice number or empty string",
  "currency": "ISO 4217 code e.g. USD EUR GBP AED SAR",
  "subtotal": number before tax (0 if absent),
  "tax": total tax amount (0 if absent),
  "tip": gratuity amount (0 if none),
  "discount": total savings/promo amount (0 if none),
  "total": final amount paid (required, positive number),
  "paymentMethod": "Cash | Credit Card | Debit Card | Apple Pay | Google Pay | Gift Card | or empty string",
  "cardLast4": "4-digit string if card payment otherwise empty string",
  "category": exactly one of: "Food & Dining" | "Travel & Transport" | "Shopping" | "Utilities" | "Healthcare" | "Entertainment" | "Office & Business" | "Groceries" | "Fuel" | "Other",
  "lineItems": [
    { "name": "item description", "quantity": number, "unitPrice": number, "total": number }
  ],
  "flags": ["notable observations e.g. High tip 22%, Missing itemization, Possible duplicate amount"],
  "summary": "2-3 concise sentences: what was purchased, where, and any noteworthy aspects"
}

Rules: all numeric fields must be numbers (not strings); use 0 for absent numbers; empty string for absent text; be thorough with line items.`

function parseJSON(raw: string): object {
  const cleaned = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()
  return JSON.parse(cleaned)
}

// ─── Provider-specific calls ──────────────────────────────────────────────────

async function callGemini(apiKey: string, input: InputPayload): Promise<object> {
  // Use gemini-2.0-flash — a stable, vision-capable model
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`
  const parts: object[] =
    input.kind === 'image'
      ? [
          { inlineData: { mimeType: input.mimeType, data: input.data } },
          { text: RECEIPT_PROMPT },
        ]
      : [{ text: `${RECEIPT_PROMPT}\n\nRECEIPT TEXT:\n${input.content.slice(0, 14000)}` }]

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: { maxOutputTokens: 4096, temperature: 0.1 },
    }),
  })
  if (!res.ok) {
    const e = await res.json().catch(() => ({}))
    throw new Error((e as { error?: { message?: string } }).error?.message ?? `Gemini ${res.status}`)
  }
  const data = await res.json() as {
    candidates: Array<{ content: { parts: Array<{ text: string }> } }>
  }
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Empty Gemini response')
  return parseJSON(text)
}

async function callAnthropic(apiKey: string, input: InputPayload): Promise<object> {
  const userContent: object[] =
    input.kind === 'image'
      ? [
          { type: 'image', source: { type: 'base64', media_type: input.mimeType, data: input.data } },
          { type: 'text', text: RECEIPT_PROMPT },
        ]
      : [{ type: 'text', text: `${RECEIPT_PROMPT}\n\nRECEIPT TEXT:\n${input.content.slice(0, 14000)}` }]

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [{ role: 'user', content: userContent }],
    }),
  })
  if (!res.ok) {
    const e = await res.json().catch(() => ({}))
    throw new Error((e as { error?: { message?: string } }).error?.message ?? `Anthropic ${res.status}`)
  }
  const data = await res.json() as { content: Array<{ type: string; text?: string }> }
  const block = data.content.find((b) => b.type === 'text')
  if (!block?.text) throw new Error('No text in Anthropic response')
  return parseJSON(block.text)
}

async function callOpenAI(
  apiKey: string,
  input: InputPayload,
  baseUrl = 'https://api.openai.com/v1',
  model = 'gpt-4o',
): Promise<object> {
  const userContent: object[] =
    input.kind === 'image'
      ? [
          { type: 'image_url', image_url: { url: `data:${input.mimeType};base64,${input.data}` } },
          { type: 'text', text: RECEIPT_PROMPT },
        ]
      : [{ type: 'text', text: `${RECEIPT_PROMPT}\n\nRECEIPT TEXT:\n${input.content.slice(0, 14000)}` }]

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      temperature: 0.1,
      messages: [{ role: 'user', content: userContent }],
    }),
  })
  if (!res.ok) {
    const e = await res.json().catch(() => ({}))
    throw new Error((e as { error?: { message?: string } }).error?.message ?? `OpenAI ${res.status}`)
  }
  const data = await res.json() as { choices: Array<{ message: { content: string } }> }
  const text = data.choices?.[0]?.message?.content
  if (!text) throw new Error('No text in OpenAI response')
  return parseJSON(text)
}

async function callCopilot(apiKey: string, input: InputPayload, endpoint: string): Promise<object> {
  if (!endpoint) throw new Error('Azure endpoint URL is required for Copilot')
  const url = endpoint.includes('/chat/completions')
    ? endpoint
    : `${endpoint.replace(/\/$/, '')}/chat/completions?api-version=2024-08-01-preview`

  const userContent: object[] =
    input.kind === 'image'
      ? [
          { type: 'image_url', image_url: { url: `data:${input.mimeType};base64,${input.data}` } },
          { type: 'text', text: RECEIPT_PROMPT },
        ]
      : [{ type: 'text', text: `${RECEIPT_PROMPT}\n\nRECEIPT TEXT:\n${input.content.slice(0, 14000)}` }]

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': apiKey },
    body: JSON.stringify({
      max_tokens: 4096,
      temperature: 0.1,
      messages: [{ role: 'user', content: userContent }],
    }),
  })
  if (!res.ok) {
    const e = await res.json().catch(() => ({}))
    throw new Error((e as { error?: { message?: string } }).error?.message ?? `Copilot ${res.status}`)
  }
  const data = await res.json() as { choices: Array<{ message: { content: string } }> }
  const text = data.choices?.[0]?.message?.content
  if (!text) throw new Error('No text in Copilot response')
  return parseJSON(text)
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function analyzeReceipt(
  file: File,
  provider: Provider,
  apiKey: string,
  id: string,
  endpoint?: string,
): Promise<ReceiptAnalysis> {
  const fileUrl = URL.createObjectURL(file)
  const fileType: 'image' | 'pdf' = isImageFile(file) ? 'image' : 'pdf'

  const base: ReceiptAnalysis = {
    id,
    fileName: file.name,
    fileUrl,
    fileType,
    status: 'analyzing',
    provider,
    merchantName: '',
    merchantAddress: '',
    merchantPhone: '',
    date: '',
    time: '',
    receiptNumber: '',
    currency: 'USD',
    subtotal: 0,
    tax: 0,
    tip: 0,
    discount: 0,
    total: 0,
    paymentMethod: '',
    cardLast4: '',
    category: 'Other',
    lineItems: [],
    flags: [],
    summary: '',
  }

  try {
    const input = await prepareInput(file)

    let raw: object
    if (provider === 'gemini')         raw = await callGemini(apiKey, input)
    else if (provider === 'anthropic') raw = await callAnthropic(apiKey, input)
    else if (provider === 'openai')    raw = await callOpenAI(apiKey, input)
    else                               raw = await callCopilot(apiKey, input, endpoint ?? '')

    const r = raw as {
      merchantName: string; merchantAddress: string; merchantPhone: string
      date: string; time: string; receiptNumber: string; currency: string
      subtotal: number; tax: number; tip: number; discount: number; total: number
      paymentMethod: string; cardLast4: string; category: string
      lineItems: ReceiptLineItem[]; flags: string[]; summary: string
    }

    return {
      ...base,
      merchantName:    r.merchantName    || 'Unknown',
      merchantAddress: r.merchantAddress || '',
      merchantPhone:   r.merchantPhone   || '',
      date:            r.date            || '',
      time:            r.time            || '',
      receiptNumber:   r.receiptNumber   || '',
      currency:        r.currency        || 'USD',
      subtotal:        Number(r.subtotal)  || 0,
      tax:             Number(r.tax)       || 0,
      tip:             Number(r.tip)       || 0,
      discount:        Number(r.discount)  || 0,
      total:           Number(r.total)     || 0,
      paymentMethod:   r.paymentMethod   || '',
      cardLast4:       r.cardLast4        || '',
      category:        r.category         || 'Other',
      lineItems:       Array.isArray(r.lineItems) ? r.lineItems : [],
      flags:           Array.isArray(r.flags)     ? r.flags     : [],
      summary:         r.summary          || '',
      status:          'done',
    }
  } catch (err) {
    return {
      ...base,
      merchantName: file.name.replace(/\.(pdf|jpg|jpeg|png|webp|heic)$/i, ''),
      status: 'error',
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}
