import Link from 'next/link'
import { Lock, ShieldAlert, FlaskConical } from 'lucide-react'
import { OutcomeBadge } from './OutcomeBadge'
import { isDemoId } from '@/lib/predictions/demoData'
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
 * One row, used identically on /markets, the leaderboard-linked profile pages, and (via
 * `useMarketData`) Live Demo Mode. A demo card renders as a plain div rather than a
 * `Link` — its id was never committed on chain, so `/p/<id>` has nothing real to show,
 * and pretending otherwise would be exactly the kind of blurred line this product exists
 * to argue against. The small flask badge marks it as sample data at the card level too,
 * not just in the page banner above it.
 */
export function PredictionCard({ prediction: p }: { prediction: Prediction }) {
  const isSealed = p.visibility === 'SEALED' && !p.revealed
  const demo = isDemoId(p.id)

  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <OutcomeBadge outcome={p.outcome} lifecycle={p.lifecycle} />
          {p.selfResolved && <ShieldAlert aria-hidden className="h-3.5 w-3.5 text-signal-pending" />}
          {demo && (
            <span className="flex items-center gap-1 rounded-full border border-monad/25 bg-monad/10 px-1.5 py-0.5 text-[0.6rem] font-medium text-monad-bright">
              <FlaskConical aria-hidden className="h-2.5 w-2.5" />
              Demo
            </span>
          )}
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
    </>
  )

  if (demo) {
    return <div className="surface flex cursor-default flex-col gap-2.5 px-4 py-4">{body}</div>
  }

  return (
    <Link href={`/p/${p.id}`} className="surface flex flex-col gap-2.5 px-4 py-4 transition-colors active:bg-white/[0.05]">
      {body}
    </Link>
  )
}
