import Link from 'next/link'
import { Lock, ShieldAlert } from 'lucide-react'
import { OutcomeBadge } from './OutcomeBadge'
import type { Prediction } from '@/lib/predictions/types'

function short(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}

function timeLabel(p: Prediction): string {
  const resolvesAt = Number(p.resolvesAt) * 1000
  if (p.outcome !== 'UNRESOLVED') return 'Resolved'
  const days = Math.round((resolvesAt - Date.now()) / 86_400_000)
  if (days <= 0) return 'Resolving now'
  if (days === 1) return 'Resolves tomorrow'
  return `Resolves in ${days}d`
}

/**
 * One row, used identically on /markets and a profile page — a viewer sees the same
 * card whether they arrived by browsing or by looking up one person, which is what
 * lets "click through from the leaderboard" and "discover cold" feel like the same app.
 */
export function PredictionCard({ prediction: p }: { prediction: Prediction }) {
  const isSealed = p.visibility === 'SEALED' && !p.revealed
  return (
    <Link
      href={`/p/${p.id}`}
      className="surface flex flex-col gap-2.5 px-4 py-4 transition-colors active:bg-white/[0.05]"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <OutcomeBadge outcome={p.outcome} lifecycle={p.lifecycle} />
          {p.selfResolved && <ShieldAlert aria-hidden className="h-3.5 w-3.5 text-signal-pending" />}
        </div>
        <span className="text-[0.7rem] text-chalk-faint">{timeLabel(p)}</span>
      </div>

      <p className="text-small leading-snug text-chalk">
        {isSealed ? (
          <span className="flex items-center gap-1.5 text-chalk-faint">
            <Lock aria-hidden className="h-3.5 w-3.5" />
            Sealed — not yet revealed
          </span>
        ) : (
          (p.content?.text ?? 'Revealed — loading text…')
        )}
      </p>

      <div className="flex items-center justify-between text-[0.7rem] text-chalk-faint">
        <span className="tabular font-mono">{short(p.author)}</span>
        <span>{p.content?.category ?? '—'} · {p.confidence}% confidence</span>
      </div>
    </Link>
  )
}
