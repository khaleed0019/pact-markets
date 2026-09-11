'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Compass } from 'lucide-react'
import { WalletButton } from '@/components/WalletButton'
import { PredictionCard } from '@/components/PredictionCard'
import { useMarketData } from '@/lib/chain/useMarketData'
import { DemoBanner, DemoToggleOn, useDemoMode } from '@/components/DemoMode'
import { CATEGORIES, type Category } from '@/lib/predictions/types'
import { PACT_REGISTRY_ADDRESS } from '@/lib/chain/monad'
import { cn } from '@/lib/cn'

type Filter = 'ALL' | Category

/**
 * Discover Markets: every prediction ever committed on this contract, reconstructed
 * live from the event log by `useAllPredictions` — there is no separate feed to seed or
 * keep in sync, what's on chain is what's shown. (Or, in Live Demo Mode, the labeled
 * sample data from `useMarketData` — see components/DemoMode.tsx.)
 */
export default function MarketsPage() {
  return (
    <Suspense fallback={null}>
      <MarketsPageInner />
    </Suspense>
  )
}

function MarketsPageInner() {
  const { predictions, loading, error, demoMode } = useMarketData()
  const { setDemoMode } = useDemoMode()
  const searchParams = useSearchParams()
  const [filter, setFilter] = useState<Filter>('ALL')

  // Lets the landing page's "browse with sample data" link turn demo mode on directly,
  // rather than requiring a second click once someone lands here.
  useEffect(() => {
    if (searchParams.get('demo') === '1') setDemoMode(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const filtered = useMemo(() => {
    if (filter === 'ALL') return predictions
    return predictions.filter((p) => p.content?.category === filter)
  }, [predictions, filter])

  return (
    <main className="mx-auto max-w-lg px-6 pb-24">
      <header className="flex items-center justify-between py-5">
        <Link href="/" className="flex h-10 w-10 items-center justify-center rounded-full text-chalk-muted active:bg-white/10">
          <ArrowLeft aria-hidden className="h-5 w-5" />
        </Link>
        <WalletButton />
      </header>

      <div className="flex items-center gap-2">
        <Compass aria-hidden className="h-5 w-5 text-monad-bright" />
        <h1 className="text-title text-chalk">Discover</h1>
      </div>
      <p className="mt-1.5 text-small text-chalk-muted">
        Every prediction committed on this contract, live from the chain.
      </p>

      <div className="mt-5">
        <DemoBanner />
        <DemoToggleOn />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <FilterPill active={filter === 'ALL'} onClick={() => setFilter('ALL')}>
          All
        </FilterPill>
        {CATEGORIES.map((c) => (
          <FilterPill key={c} active={filter === c} onClick={() => setFilter(c)}>
            {c.charAt(0) + c.slice(1).toLowerCase()}
          </FilterPill>
        ))}
      </div>

      <div className="mt-5 space-y-2.5">
        {!demoMode && !PACT_REGISTRY_ADDRESS && (
          <EmptyNotice
            title="Contract not deployed yet"
            body="NEXT_PUBLIC_PACT_REGISTRY_ADDRESS isn't set. Run npm run deploy:monad, check .env.local, or turn on Demo mode above."
          />
        )}
        {(demoMode || PACT_REGISTRY_ADDRESS) && loading && (
          <>
            <div className="h-28 animate-pulse rounded-2xl bg-white/[0.03]" />
            <div className="h-28 animate-pulse rounded-2xl bg-white/[0.03]" />
            <div className="h-28 animate-pulse rounded-2xl bg-white/[0.03]" />
          </>
        )}
        {(demoMode || PACT_REGISTRY_ADDRESS) && error && (
          <EmptyNotice title="Couldn't load predictions" body={error.message} />
        )}
        {(demoMode || PACT_REGISTRY_ADDRESS) && !loading && !error && filtered.length === 0 && (
          <EmptyNotice
            title={predictions.length === 0 ? 'No predictions yet' : 'Nothing in this category yet'}
            body={predictions.length === 0 ? 'Be the first to commit one.' : 'Try a different filter.'}
          />
        )}
        {filtered.map((p) => (
          <PredictionCard key={p.id.toString()} prediction={p} />
        ))}
      </div>
    </main>
  )
}

function FilterPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'shrink-0 rounded-full border px-3.5 py-1.5 text-[0.75rem] font-medium transition-colors',
        active ? 'border-monad/50 bg-monad/15 text-monad-bright' : 'border-white/[0.08] bg-white/[0.02] text-chalk-muted',
      )}
    >
      {children}
    </button>
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
