import { cn } from '@/lib/cn'
import type { Outcome } from '@/lib/predictions/types'

/**
 * The one place outcome -> label/color is decided, shared by the proof page, market
 * cards and the profile list — so "correct" reads identically everywhere instead of
 * three slightly different badges drifting apart over time.
 */
const MAP: Record<Outcome, { label: string; waitingLabel?: string; className: string }> = {
  UNRESOLVED: {
    label: 'Locked',
    waitingLabel: 'Awaiting resolution',
    className: 'border-signal-pending/30 bg-signal-pending/10 text-signal-pending',
  },
  CORRECT: { label: 'Correct', className: 'border-signal-correct/30 bg-signal-correct/10 text-signal-correct' },
  INCORRECT: {
    label: 'Incorrect',
    className: 'border-signal-incorrect/30 bg-signal-incorrect/10 text-signal-incorrect',
  },
  VOID: { label: 'Void', className: 'border-signal-void/30 bg-signal-void/10 text-signal-void' },
}

export function OutcomeBadge({ outcome, lifecycle }: { outcome: Outcome; lifecycle?: string }) {
  const entry = MAP[outcome]
  const label = lifecycle === 'WAITING' && entry.waitingLabel ? entry.waitingLabel : entry.label
  return (
    <span
      className={cn(
        'rounded-full border px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wider',
        entry.className,
      )}
    >
      {label}
    </span>
  )
}
