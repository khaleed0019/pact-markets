'use client'

import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'
import type { PactScoreBreakdown } from '@/lib/predictions/score'

type State = { status: 'loading' } | { status: 'not_configured' } | { status: 'error' } | { status: 'ready'; summary: string }

/**
 * A written sentence over a profile's own already-computed numbers — the model never
 * generates a statistic, only prose describing the stats `computePactScore` produced.
 * If the numbers are wrong, this sentence is wrong the same way the stat cards above it
 * are; there is no separate AI-derived fact to distrust independently.
 */
export function TrackRecordSummary({ score, streak }: { score: PactScoreBreakdown; streak: number }) {
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    if (score.countedTotal === 0) return
    let cancelled = false
    setState({ status: 'loading' })
    fetch('/api/intelligence/summary', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...score, streak }),
    })
      .then(async (res) => {
        if (cancelled) return
        if (res.status === 503) return setState({ status: 'not_configured' })
        if (!res.ok) return setState({ status: 'error' })
        const data = (await res.json()) as { summary: string }
        setState({ status: 'ready', summary: data.summary })
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error' })
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score.score, score.correct, score.incorrect, score.voided, score.countedTotal, streak])

  if (score.countedTotal === 0 || state.status === 'error') return null
  if (state.status === 'not_configured') return null // silent — this is a bonus panel, not load-bearing

  return (
    <div className="mt-4 flex items-start gap-2 rounded-xl border border-monad/20 bg-monad/[0.06] px-4 py-3">
      <Sparkles aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0 text-monad-bright" />
      {state.status === 'loading' ? (
        <div className="h-4 w-2/3 animate-pulse rounded bg-white/[0.06]" />
      ) : (
        <p className="text-[0.75rem] leading-relaxed text-chalk-muted">{state.summary}</p>
      )}
    </div>
  )
}
