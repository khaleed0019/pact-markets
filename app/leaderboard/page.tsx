'use client'

import Link from 'next/link'
import { ArrowLeft, Trophy, Flame, FlaskConical } from 'lucide-react'
import { WalletButton } from '@/components/WalletButton'
import { useMarketData } from '@/lib/chain/useMarketData'
import { DemoBanner, DemoToggleOn } from '@/components/DemoMode'
import { buildLeaderboard } from '@/lib/predictions/aggregate'
import { isDemoId } from '@/lib/predictions/demoData'
import { PACT_REGISTRY_ADDRESS } from '@/lib/chain/monad'
import { cn } from '@/lib/cn'

function short(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}

/**
 * Ranked by Pact Score, computed identically to a profile page's own number — see
 * lib/predictions/aggregate.ts. Nobody with zero resolved, non-self-resolved
 * predictions appears here: a rank built on no evidence would just be alphabetical
 * order wearing a leaderboard's clothes.
 */
export default function LeaderboardPage() {
  const { predictions, loading, error, demoMode } = useMarketData()
  const entries = buildLeaderboard(predictions).filter((e) => e.score.countedTotal > 0)

  return (
    <main className="mx-auto max-w-lg px-6 pb-24">
      <header className="flex items-center justify-between py-5">
        <Link href="/" className="flex h-10 w-10 items-center justify-center rounded-full text-chalk-muted active:bg-white/10">
          <ArrowLeft aria-hidden className="h-5 w-5" />
        </Link>
        <WalletButton />
      </header>

      <div className="flex items-center gap-2">
        <Trophy aria-hidden className="h-5 w-5 text-monad-bright" />
        <h1 className="text-title text-chalk">Leaderboard</h1>
      </div>
      <p className="mt-1.5 text-small text-chalk-muted">
        Ranked by Pact Score — recomputable by anyone from the chain's own event log.
      </p>

      <div className="mt-5">
        <DemoBanner />
        <DemoToggleOn />
      </div>

      <div className="space-y-2">
        {!demoMode && !PACT_REGISTRY_ADDRESS && (
          <EmptyNotice title="Contract not deployed yet" body="Run npm run deploy:monad, check .env.local, or turn on Demo mode above." />
        )}
        {(demoMode || PACT_REGISTRY_ADDRESS) && loading && (
          <>
            <div className="h-16 animate-pulse rounded-2xl bg-white/[0.03]" />
            <div className="h-16 animate-pulse rounded-2xl bg-white/[0.03]" />
            <div className="h-16 animate-pulse rounded-2xl bg-white/[0.03]" />
          </>
        )}
        {(demoMode || PACT_REGISTRY_ADDRESS) && error && <EmptyNotice title="Couldn't load the leaderboard" body={error.message} />}
        {(demoMode || PACT_REGISTRY_ADDRESS) && !loading && !error && entries.length === 0 && (
          <EmptyNotice title="No resolved predictions yet" body="Ranks appear once predictions start resolving." />
        )}
        {entries.map((entry, i) => {
          const demo = entry.predictions.some((p) => isDemoId(p.id))
          return (
            <Link
              key={entry.author}
              href={`/u/${entry.author}`}
              className="surface flex items-center gap-3 px-4 py-3.5 transition-colors active:bg-white/[0.05]"
            >
              <span
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[0.75rem] font-bold tabular',
                  i === 0
                    ? 'bg-monad/20 text-monad-bright'
                    : i < 3
                      ? 'bg-white/[0.08] text-chalk'
                      : 'bg-white/[0.03] text-chalk-faint',
                )}
              >
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="tabular flex items-center gap-1.5 truncate font-mono text-small text-chalk">
                  {short(entry.author)}
                  {demo && <FlaskConical aria-hidden className="h-3 w-3 shrink-0 text-monad-bright" />}
                </p>
                <p className="text-[0.7rem] text-chalk-faint">
                  {entry.score.correct}-{entry.score.incorrect}
                  {entry.score.voided > 0 ? ` · ${entry.score.voided} void` : ''} ·{' '}
                  {entry.score.accuracy !== null ? `${Math.round(entry.score.accuracy * 100)}% accuracy` : 'unresolved'}
                </p>
              </div>
              {entry.streak > 1 && (
                <span className="flex items-center gap-1 text-[0.7rem] font-medium text-signal-pending">
                  <Flame aria-hidden className="h-3.5 w-3.5" />
                  {entry.streak}
                </span>
              )}
              <div className="text-right">
                <p className="tabular text-body font-bold text-chalk">{entry.score.score}</p>
                <p className="text-[0.65rem] uppercase tracking-wider text-chalk-faint">{entry.score.level}</p>
              </div>
            </Link>
          )
        })}
      </div>
    </main>
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
