'use client'

import { useEffect, useState } from 'react'
import { Sparkles, CircleAlert } from 'lucide-react'

type State =
  | { status: 'loading' }
  | { status: 'not_configured' }
  | { status: 'error' }
  | { status: 'ready'; clarity: 'CLEAR' | 'AMBIGUOUS'; note: string }

/**
 * Reads a prediction's resolution criteria the same way a stranger would have to when
 * grading it, and says whether that's actually possible without judgment calls. Never
 * says anything about whether the prediction itself will come true — that would be the
 * model inventing a fact the chain doesn't have, which is exactly the failure mode this
 * whole product exists to argue against.
 */
export function CriteriaInsight({ text, criteria }: { text: string; criteria: string }) {
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    setState({ status: 'loading' })
    fetch('/api/intelligence/criteria', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text, criteria }),
    })
      .then(async (res) => {
        if (cancelled) return
        if (res.status === 503) return setState({ status: 'not_configured' })
        if (!res.ok) return setState({ status: 'error' })
        const data = (await res.json()) as { clarity: 'CLEAR' | 'AMBIGUOUS'; note: string }
        setState({ status: 'ready', ...data })
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error' })
      })
    return () => {
      cancelled = true
    }
  }, [text, criteria])

  if (state.status === 'loading') {
    return <div className="mt-3 h-12 animate-pulse rounded-xl bg-white/[0.03]" />
  }

  if (state.status === 'not_configured') {
    return (
      <div className="mt-3 flex items-start gap-2 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-3">
        <CircleAlert aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0 text-chalk-faint" />
        <p className="text-[0.7rem] leading-relaxed text-chalk-faint">
          AI criteria check isn't configured on this deployment (no GEMINI_API_KEY set).
        </p>
      </div>
    )
  }

  if (state.status === 'error') return null // fail quiet — this panel is a bonus, not a claim

  const clear = state.clarity === 'CLEAR'
  return (
    <div
      className={`mt-3 flex items-start gap-2 rounded-xl border px-3.5 py-3 ${
        clear ? 'border-signal-correct/25 bg-signal-correct/5' : 'border-signal-pending/25 bg-signal-pending/5'
      }`}
    >
      <Sparkles aria-hidden className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${clear ? 'text-signal-correct' : 'text-signal-pending'}`} />
      <div>
        <p className={`text-[0.7rem] font-medium ${clear ? 'text-signal-correct' : 'text-signal-pending'}`}>
          {clear ? 'Objectively resolvable' : 'Criteria may need judgment calls'}
        </p>
        <p className="mt-0.5 text-[0.7rem] leading-relaxed text-chalk-faint">{state.note}</p>
      </div>
    </div>
  )
}
