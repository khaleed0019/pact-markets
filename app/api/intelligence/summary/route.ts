import { NextResponse } from 'next/server'
import { askGemini, AIUnavailableError } from '@/lib/ai/gemini'

/**
 * Turns a profile's already-computed stats into a short written summary.
 *
 * The numbers themselves are never generated here — they arrive already computed by
 * `computePactScore` from real chain events, and the prompt hands them over as fixed
 * facts with an explicit instruction not to alter or invent any of them. The model's
 * only job is prose: turning "62% accuracy, 8 resolved, streak 3" into a sentence a
 * human reads faster than a stat block, not deciding what the numbers are.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    accuracy: number | null
    correct: number
    incorrect: number
    voided: number
    countedTotal: number
    streak: number
    level: string
    score: number
  } | null
  if (!body || body.countedTotal === undefined) {
    return NextResponse.json({ error: 'stats payload is required.' }, { status: 400 })
  }

  const system = `You write one short, factual sentence (under 220 characters) summarizing a prediction track record, using ONLY the exact numbers given to you. Never invent, round differently, or estimate any figure not present in the input. No preamble, no markdown — plain text, one sentence.`

  const userMessage = JSON.stringify(body)

  try {
    const summary = await askGemini(system, userMessage, 150)
    return NextResponse.json({ summary })
  } catch (cause) {
    if (cause instanceof AIUnavailableError) {
      return NextResponse.json({ error: 'not_configured' }, { status: 503 })
    }
    return NextResponse.json({ error: 'AI analysis failed.' }, { status: 502 })
  }
}
