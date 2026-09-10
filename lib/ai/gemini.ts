/**
 * Server-only wrapper around the Gemini API (free tier).
 *
 * Never imported from a client component — the API key must stay on the server. Every
 * caller in this app follows one rule: the prompt always carries the real computed
 * numbers (accuracy, confidence, dates already read from chain events), and the model is
 * explicitly told to describe *only* those numbers, never to invent a fact about the
 * world or about a prediction's outcome. This is analysis of data the app already
 * trusts, not a second source of truth.
 */
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash'
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

export class AIUnavailableError extends Error {}

export async function askGemini(system: string, userMessage: string, maxTokens = 400): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new AIUnavailableError('GEMINI_API_KEY is not set on the server.')
  }

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      generationConfig: { maxOutputTokens: maxTokens, temperature: 0.2 },
    }),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`Gemini API request failed (${response.status}): ${body.slice(0, 300)}`)
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
  }
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('')
  if (!text) throw new Error('Gemini API returned no text content.')
  return text.trim()
}
