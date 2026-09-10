'use client'

import { Check, Lock, Clock, Eye, Gavel } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { Outcome, PredictionLifecycle, Visibility } from '@/lib/predictions/types'

/**
 * The lifecycle, drawn.
 *
 * Five rows, but only three of them are states the chain distinguishes — committing
 * creates and locks in the same transaction, and resolving both grades the prediction
 * and updates the score. Those pairs are drawn as one row each rather than padded out to
 * five separate steps, because showing two on-screen steps for one on-chain event is
 * exactly the kind of theatre this product exists to argue against. Reveal is its own row
 * only because for a sealed prediction it genuinely is a separate transaction, at a
 * separate moment, chosen by the author.
 */
export function PredictionTimeline({
  lifecycle,
  visibility,
  revealed,
  outcome,
  createdAt,
  resolvesAt,
}: {
  lifecycle: PredictionLifecycle
  visibility: Visibility
  revealed: boolean
  outcome: Outcome
  createdAt: bigint
  resolvesAt: bigint
}) {
  const resolved = outcome !== 'UNRESOLVED'
  const deadlinePassed = Date.now() >= Number(resolvesAt) * 1000

  const steps = [
    {
      icon: Lock,
      title: 'Committed & locked on Monad',
      detail: new Date(Number(createdAt) * 1000).toLocaleString(),
      done: true,
      note: 'One transaction — creating it and locking it are the same event.',
    },
    {
      icon: Eye,
      title: revealed ? 'Revealed' : visibility === 'SEALED' ? 'Not yet revealed' : 'Revealed',
      detail: revealed
        ? 'Text verified against the committed hash'
        : 'The words are still sealed — only their hash is on chain',
      done: revealed,
      note: revealed ? undefined : 'Until this happens, the chain proves timing but not content.',
    },
    {
      icon: Clock,
      title: deadlinePassed ? 'Deadline passed' : 'Waiting for the outcome',
      detail: new Date(Number(resolvesAt) * 1000).toLocaleString(),
      done: deadlinePassed,
    },
    {
      icon: Gavel,
      title: resolved ? `Resolved — ${outcome.toLowerCase()}` : 'Not resolved yet',
      detail: resolved ? 'Score updated in the same event' : 'Can only happen after the deadline, and after reveal',
      done: resolved,
    },
  ]

  return (
    <ol className="relative space-y-0">
      {steps.map((step, index) => {
        const Icon = step.done ? Check : step.icon
        const isLast = index === steps.length - 1
        return (
          <li key={step.title} className="relative flex gap-3.5 pb-6 last:pb-0">
            {!isLast && (
              <span
                aria-hidden
                className={cn(
                  'absolute left-[0.9375rem] top-8 h-full w-px',
                  step.done ? 'bg-monad/40' : 'bg-white/[0.08]',
                )}
              />
            )}
            <span
              className={cn(
                'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border',
                step.done
                  ? 'border-monad/45 bg-monad/15 text-monad-bright'
                  : 'border-white/[0.09] bg-ink-850 text-chalk-faint',
              )}
            >
              <Icon aria-hidden className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 pt-1">
              <p className={cn('text-small font-medium', step.done ? 'text-chalk' : 'text-chalk-muted')}>
                {step.title}
              </p>
              <p className="mt-0.5 text-[0.7rem] leading-relaxed text-chalk-faint">{step.detail}</p>
              {step.note && <p className="mt-1 text-[0.7rem] leading-relaxed text-chalk-faint/80">{step.note}</p>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
