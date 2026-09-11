'use client'

import { use } from 'react'
import Link from 'next/link'
import { useAccount } from 'wagmi'
import { ArrowLeft, Flame, ShieldAlert } from 'lucide-react'
import { WalletButton } from '@/components/WalletButton'
import { PredictionCard } from '@/components/PredictionCard'
import { useMarketData } from '@/lib/chain/useMarketData'
import { DemoBanner, DemoToggleOn } from '@/components/DemoMode'
import { predictionsFor } from '@/lib/predictions/aggregate'
import { computePactScore, currentStreak, type ScoredPrediction } from '@/lib/predictions/score'
import { TrackRecordSummary } from '@/components/TrackRecordSummary'
import { explorerAddressUrl, PACT_REGISTRY_ADDRESS } from '@/lib/chain/monad'
import type { Prediction } from '@/lib/predictions/types'

function short(address: string): string {
  return `${address.slice(0, 8)}…${address.slice(-6)}`
}

function toScored(p: Prediction): ScoredPrediction {
  return {
    outcome: p.outcome,
    confidence: p.confidence,
    createdAt: Number(p.createdAt),
    resolvesAt: Number(p.resolvesAt),
    selfResolved: p.selfResolved,
  }
}

/**
 * One address's whole public record: every prediction it has ever committed, its Pact
 * Score, and the arithmetic behind that score — all derived client-side from
 * `useAllPredictions`, the same event-log read every other page uses. There is no
 * separate "profile" data source to keep honest; this page is just a filter and a
 * calculation over facts every other page already has.
 */
export default function ProfilePage({ params }: { params: Promise<{ address: string }> }) {
  const { address: rawAddress } = use(params)
  const address = rawAddress as `0x${string}`
  const { address: viewer } = useAccount()
  const { predictions, loading, error, demoMode } = useMarketData()

  const mine = predictionsFor(predictions, address)
  const scored = mine.map(toScored)
  const score = computePactScore(scored)
  const streak = currentStreak(scored)
  const isSelf = viewer?.toLowerCase() === address.toLowerCase()

  return (
    <main className="mx-auto max-w-lg px-6 pb-24">
      <header className="flex items-center justify-between py-5">
        <Link href="/leaderboard" className="flex h-10 w-10 items-center justify-center rounded-full text-chalk-muted active:bg-white/10">
          <ArrowLeft aria-hidden className="h-5 w-5" />
        </Link>
        <WalletButton />
      </header>

      <div className="flex items-center gap-2">
        <a
          href={explorerAddressUrl(address)}
          target="_blank"
          rel="noreferrer noopener"
          className="tabular truncate font-mono text-title text-chalk underline decoration-white/20 underline-offset-4"
        >
          {short(address)}
        </a>
        {isSelf && (
          <span className="rounded-full border border-monad/30 bg-monad/10 px-2 py-0.5 text-[0.65rem] font-medium text-monad-bright">
            You
          </span>
        )}
      </div>

      <section className="mt-5 grid grid-cols-3 gap-2.5">
        <StatCard label="Pact Score" value={score.score.toString()} sub={score.level} />
        <StatCard
          label="Accuracy"
          value={score.accuracy !== null ? `${Math.round(score.accuracy * 100)}%` : '—'}
          sub={`${score.correct}-${score.incorrect}`}
        />
        <StatCard
          label="Streak"
          value={streak.toString()}
          sub={streak > 0 ? 'correct in a row' : 'none active'}
          icon={streak > 1 ? Flame : undefined}
        />
      </section>

      <TrackRecordSummary score={score} streak={streak} />

      {score.excludedSelfResolved > 0 && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-signal-pending/25 bg-signal-pending/5 px-4 py-3">
          <ShieldAlert aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0 text-signal-pending" />
          <p className="text-[0.7rem] leading-relaxed text-chalk-faint">
            {score.excludedSelfResolved} prediction{score.excludedSelfResolved === 1 ? '' : 's'} graded by this
            author, not an independent resolver — shown below, but excluded from every number above.
          </p>
        </div>
      )}

      <h2 className="mt-7 text-micro font-semibold uppercase tracking-wider text-chalk-faint">
        All predictions ({mine.length})
      </h2>
      <div className="mt-3">
        <DemoBanner />
        <DemoToggleOn />
      </div>
      <div className="space-y-2.5">
        {!demoMode && !PACT_REGISTRY_ADDRESS && (
          <EmptyNotice title="Contract not deployed yet" body="Run npm run deploy:monad, check .env.local, or turn on Demo mode above." />
        )}
        {(demoMode || PACT_REGISTRY_ADDRESS) && loading && <div className="h-28 animate-pulse rounded-2xl bg-white/[0.03]" />}
        {(demoMode || PACT_REGISTRY_ADDRESS) && error && <EmptyNotice title="Couldn't load this profile" body={error.message} />}
        {(demoMode || PACT_REGISTRY_ADDRESS) && !loading && !error && mine.length === 0 && (
          <EmptyNotice title="No predictions yet" body="Nothing committed by this address on this contract." />
        )}
        {mine.map((p) => (
          <PredictionCard key={p.id.toString()} prediction={p} />
        ))}
      </div>
    </main>
  )
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string
  value: string
  sub: string
  icon?: typeof Flame
}) {
  return (
    <div className="surface px-3 py-3.5 text-center">
      <p className="text-micro uppercase tracking-wider text-chalk-faint">{label}</p>
      <p className="tabular mt-1 flex items-center justify-center gap-1 text-title text-chalk">
        {Icon && <Icon aria-hidden className="h-4 w-4 text-signal-pending" />}
        {value}
      </p>
      <p className="mt-0.5 text-[0.65rem] text-chalk-faint">{sub}</p>
    </div>
  )
}

function EmptyNotice({ title, body }: { title: string; body: string }) {
  return (
    <div className="surface px-5 py-8 text-center">
      <p className="text-small font-medium text-chalk">{title}</p>
      <p className="mt-1 text-[0.75rem] text-chalk-faint">{body}</p>
    </div>
  )
}
