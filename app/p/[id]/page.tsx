'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { useAccount } from 'wagmi'
import { ArrowLeft, Copy, Check, ExternalLink, ShieldAlert, Gavel } from 'lucide-react'
import { WalletButton } from '@/components/WalletButton'
import { Button } from '@/components/ui/Button'
import { PredictionTimeline } from '@/components/PredictionTimeline'
import { usePrediction, useRevealPrediction, useResolvePrediction, useRevealedContent } from '@/lib/chain/useRegistry'
import { readStoredSalt } from '@/lib/predictions/commitment'
import { deriveLifecycle } from '@/lib/predictions/types'
import { explorerAddressUrl } from '@/lib/chain/monad'
import { PACT_REGISTRY_ADDRESS } from '@/lib/chain/monad'
import { cn } from '@/lib/cn'
import type { Outcome } from '@/lib/predictions/types'

/**
 * The proof page.
 *
 * Everything shown here is read straight from `usePrediction`, which reads straight from
 * the chain — nothing in this component is a cached or asserted fact. The one thing NOT
 * available on chain is the revealed text of a still-sealed prediction that the *current
 * viewer* didn't commit; that gap is shown honestly rather than papered over, because a
 * sealed-but-unrevealed prediction genuinely proves timing without yet proving content.
 */
export default function ProofPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const predictionId = (() => {
    try {
      return BigInt(id)
    } catch {
      return undefined
    }
  })()

  const { address } = useAccount()
  const { prediction, isLoading, refetch } = usePrediction(predictionId)
  const { content: revealedContent } = useRevealedContent(prediction?.revealed ? predictionId : undefined)
  const { reveal, signing: revealing, confirming: confirmingReveal } = useRevealPrediction()
  const { resolveOutcome, signing: resolving, confirming: confirmingResolve } = useResolvePrediction()
  const [copied, setCopied] = useState(false)
  const [revealError, setRevealError] = useState<string | null>(null)

  if (!PACT_REGISTRY_ADDRESS) {
    return (
      <NoticeShell
        title="Contract not deployed yet"
        body="NEXT_PUBLIC_PACT_REGISTRY_ADDRESS isn't set. Run npm run deploy:monad, or check .env.local."
      />
    )
  }

  if (predictionId === undefined) {
    return <NoticeShell title="Invalid reference" body="That isn't a prediction id." />
  }

  if (isLoading) {
    return (
      <main className="mx-auto max-w-lg px-6 py-16">
        <div className="h-64 animate-pulse rounded-2xl bg-white/[0.03]" />
      </main>
    )
  }

  if (!prediction) {
    return <NoticeShell title="Not found" body={`No prediction with id ${id} exists on this contract.`} />
  }

  const lifecycle = deriveLifecycle(prediction, Date.now())
  const isAuthor = address?.toLowerCase() === prediction.author.toLowerCase()
  const isResolver = address?.toLowerCase() === prediction.resolver.toLowerCase()
  const selfResolved = prediction.resolver.toLowerCase() === prediction.author.toLowerCase()
  const canReveal = isAuthor && !prediction.revealed
  const canResolve = isResolver && prediction.revealed && lifecycle === 'WAITING'

  const storedSalt = isAuthor ? readStoredSalt(id) : null

  const copyCommitment = async () => {
    await navigator.clipboard.writeText(prediction.commitment)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const doReveal = async () => {
    if (!storedSalt) {
      setRevealError('No salt found for this prediction on this device. It can only be revealed from the browser that created it, unless you still have the original salt saved elsewhere.')
      return
    }
    setRevealError(null)
    try {
      await reveal({
        id: predictionId,
        text: storedSalt.text,
        criteria: storedSalt.criteria,
        salt: storedSalt.salt,
        reasoning: storedSalt.reasoning,
      })
      await refetch()
    } catch (cause) {
      setRevealError(cause instanceof Error ? cause.message : 'Reveal failed.')
    }
  }

  const doResolve = async (outcome: Exclude<Outcome, 'UNRESOLVED'>) => {
    await resolveOutcome({ id: predictionId, outcome })
    await refetch()
  }

  return (
    <main className="mx-auto max-w-lg px-6 pb-24">
      <header className="flex items-center justify-between py-5">
        <Link href="/" className="flex h-10 w-10 items-center justify-center rounded-full text-chalk-muted active:bg-white/10">
          <ArrowLeft aria-hidden className="h-5 w-5" />
        </Link>
        <WalletButton />
      </header>

      <div className="flex items-center gap-2">
        <OutcomeBadge outcome={prediction.outcome} lifecycle={lifecycle} />
        {selfResolved && (
          <span className="flex items-center gap-1 rounded-full border border-signal-pending/30 bg-signal-pending/10 px-2.5 py-1 text-[0.65rem] font-medium text-signal-pending">
            <ShieldAlert aria-hidden className="h-3 w-3" />
            Self-resolved
          </span>
        )}
      </div>

      <h1 className="mt-3 text-title text-chalk">
        {storedSalt?.text ??
          revealedContent?.text ??
          (prediction.revealed ? 'Revealed — fetching text from the chain…' : 'Sealed — not yet revealed')}
      </h1>

      {(storedSalt?.reasoning || revealedContent?.reasoning) && (
        <p className="mt-2 text-small leading-relaxed text-chalk-muted">
          {storedSalt?.reasoning || revealedContent?.reasoning}
        </p>
      )}

      {selfResolved && (
        <p className="mt-2 text-[0.75rem] leading-relaxed text-chalk-faint">
          This prediction's resolver is its own author. It is excluded from every Pact Score calculation — a
          record graded by the person who made it is not evidence of anything.
        </p>
      )}

      {canReveal && (
        <div className="mt-4 surface px-4 py-4">
          <p className="text-small text-chalk-muted">This is your sealed prediction. Reveal it whenever you're ready.</p>
          {revealError && <p className="mt-2 text-[0.7rem] text-signal-incorrect">{revealError}</p>}
          <Button className="mt-3" busy={revealing || confirmingReveal} onClick={() => void doReveal()}>
            Reveal now
          </Button>
        </div>
      )}

      {canResolve && (
        <div className="mt-4 surface border-monad/30 px-4 py-4">
          <div className="flex items-center gap-2">
            <Gavel aria-hidden className="h-4 w-4 text-monad-bright" />
            <p className="text-small font-medium text-chalk">Resolve this prediction</p>
          </div>
          <p className="mt-1 text-[0.7rem] text-chalk-faint">The deadline has passed. Record what actually happened.</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <Button size="md" variant="secondary" busy={resolving || confirmingResolve} onClick={() => void doResolve('CORRECT')}>
              Correct
            </Button>
            <Button size="md" variant="secondary" busy={resolving || confirmingResolve} onClick={() => void doResolve('INCORRECT')}>
              Incorrect
            </Button>
            <Button size="md" variant="ghost" busy={resolving || confirmingResolve} onClick={() => void doResolve('VOID')}>
              Void
            </Button>
          </div>
        </div>
      )}

      <section className="mt-7 surface px-5 py-5">
        <h2 className="text-micro font-semibold uppercase tracking-wider text-chalk-faint">Timeline</h2>
        <div className="mt-4">
          <PredictionTimeline
            lifecycle={lifecycle}
            visibility={prediction.visibility}
            revealed={prediction.revealed}
            outcome={prediction.outcome}
            createdAt={prediction.createdAt}
            resolvesAt={prediction.resolvesAt}
          />
        </div>
      </section>

      <section className="mt-6 space-y-2.5">
        <Row label="Author" value={prediction.author} link={explorerAddressUrl(prediction.author)} mono />
        <Row label="Resolver" value={prediction.resolver} link={explorerAddressUrl(prediction.resolver)} mono />
        <Row label="Prediction ID" value={`#${prediction.id.toString()}`} />
        <Row label="Confidence stated" value={`${prediction.confidence}%`} />
        <Row label="Network" value="Monad Testnet · chain 10143" />
        <div className="surface-quiet px-4 py-3">
          <div className="flex items-center justify-between">
            <p className="text-micro uppercase tracking-wider text-chalk-faint">Commitment hash</p>
            <button onClick={() => void copyCommitment()} className="text-chalk-faint active:text-chalk">
              {copied ? <Check className="h-3.5 w-3.5 text-signal-correct" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
          <p className="tabular mt-1 break-all text-[0.7rem] text-chalk">{prediction.commitment}</p>
        </div>
      </section>
    </main>
  )
}

function OutcomeBadge({ outcome, lifecycle }: { outcome: Outcome; lifecycle: string }) {
  const map: Record<Outcome, { label: string; className: string }> = {
    UNRESOLVED: {
      label: lifecycle === 'WAITING' ? 'Awaiting resolution' : 'Locked',
      className: 'border-signal-pending/30 bg-signal-pending/10 text-signal-pending',
    },
    CORRECT: { label: 'Correct', className: 'border-signal-correct/30 bg-signal-correct/10 text-signal-correct' },
    INCORRECT: { label: 'Incorrect', className: 'border-signal-incorrect/30 bg-signal-incorrect/10 text-signal-incorrect' },
    VOID: { label: 'Void', className: 'border-signal-void/30 bg-signal-void/10 text-signal-void' },
  }
  const { label, className } = map[outcome]
  return <span className={cn('rounded-full border px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wider', className)}>{label}</span>
}

function Row({ label, value, link, mono }: { label: string; value: string; link?: string; mono?: boolean }) {
  return (
    <div className="surface-quiet flex items-center justify-between gap-3 px-4 py-3">
      <span className="text-small text-chalk-muted">{label}</span>
      {link ? (
        <a href={link} target="_blank" rel="noreferrer noopener" className={cn('flex items-center gap-1 text-small text-monad-bright', mono && 'tabular font-mono text-[0.7rem]')}>
          {mono ? `${value.slice(0, 8)}…${value.slice(-6)}` : value}
          <ExternalLink className="h-3 w-3" />
        </a>
      ) : (
        <span className={cn('text-small text-chalk', mono && 'tabular font-mono text-[0.75rem]')}>{value}</span>
      )}
    </div>
  )
}

function NoticeShell({ title, body }: { title: string; body: string }) {
  return (
    <main className="mx-auto max-w-lg px-6 py-16 text-center">
      <h1 className="text-title text-chalk">{title}</h1>
      <p className="mt-2 text-small text-chalk-muted">{body}</p>
      <Link href="/" className="mt-5 inline-block text-small text-monad-bright underline underline-offset-4">
        Go home
      </Link>
    </main>
  )
}
