import { NextResponse } from 'next/server'
import { askGemini, AIUnavailableError } from '@/lib/ai/gemini'

/**
 * Rates how objectively resolvable a prediction's stated criteria actually are.
 *
 * This is the one place "AI" touches PACT MARKETS' actual trust claim, so it is scoped
 * narrowly on purpose: given the prediction's own words, judge whether a stranger could
 * resolve it without judgment calls — never asked to guess whether the prediction itself
 * will come true, since that would be the model inventing a fact the chain doesn't have.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { text?: string; criteria?: string } | null
  if (!body?.text || !body?.criteria) {
    return NextResponse.json({ error: 'text and criteria are required.' }, { status: 400 })
  }

  const system = `You evaluate whether a prediction's resolution criteria are objective enough for a stranger to grade the outcome without judgment calls. You are not being asked whether the prediction is true, likely, or good — only whether it is checkable. Respond with strict JSON: {"clarity":"CLEAR"|"AMBIGUOUS","note":"one sentence, under 140 characters, explaining why"}. No other text.`

  const userMessage = `Prediction: "${body.text}"\nResolution criteria: "${body.criteria}"`

  try {
    const raw = await askGemini(system, userMessage, 200)
    // Gemini occasionally wraps JSON in a ```json fence despite the instruction not to —
    // strip that before parsing rather than letting a cosmetic wrapper fail the whole panel.
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '')
    const parsed = JSON.parse(cleaned) as { clarity?: string; note?: string }
    if (parsed.clarity !== 'CLEAR' && parsed.clarity !== 'AMBIGUOUS') {
      throw new Error('Unexpected response shape from the model.')
    }
    return NextResponse.json({ clarity: parsed.clarity, note: parsed.note ?? '' })
  } catch (cause) {
    if (cause instanceof AIUnavailableError) {
      return NextResponse.json({ error: 'not_configured' }, { status: 503 })
    }
    return NextResponse.json({ error: 'AI analysis failed.' }, { status: 502 })
  }
}
