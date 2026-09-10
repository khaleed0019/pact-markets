'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import Link from 'next/link'
import { ArrowLeft, Lock, Eye, Info } from 'lucide-react'
import { WalletButton } from '@/components/WalletButton'
import { Button } from '@/components/ui/Button'
import { useCommitPrediction, useRevealPrediction } from '@/lib/chain/useRegistry'
import { computeCommitment, randomSalt, storeSalt } from '@/lib/predictions/commitment'
import { explorerTxUrl } from '@/lib/chain/monad'
import { CATEGORIES, type Category, type Visibility } from '@/lib/predictions/types'
import { PACT_REGISTRY_ABI } from '@/lib/chain/abi'
import { decodeEventLog, type Hex } from 'viem'
import { usePublicClient } from 'wagmi'

/**
 * Create a prediction.
 *
 * Everything here happens as ONE flow the user reads before signing, per the brief's
 * "make it impossible to accidentally sign without reviewing" requirement — there is a
 * review step, not a raw form-submit-to-wallet-popup jump. And "publish" here really
 * does mean two real transactions for an OPEN prediction (commit, then reveal in the same
 * flow) or one for a SEALED prediction that reveals whenever its author later chooses —
 * this page never claims a single click did more than it did.
 */
export default function CreatePage() {
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const { commit, signing: committing, confirming: confirmingCommit } = useCommitPrediction()
  const { reveal, signing: revealing, confirming: confirmingReveal } = useRevealPrediction()

  const [text, setText] = useState('')
  const [criteria, setCriteria] = useState('')
  const [category, setCategory] = useState<Category>('CRYPTO')
  const [confidence, setConfidence] = useState(70)
  const [resolveDate, setResolveDate] = useState('')
  const [visibility, setVisibility] = useState<Visibility>('OPEN')
  const [reasoning, setReasoning] = useState('')
  const [step, setStep] = useState<'form' | 'review' | 'committing' | 'done'>('form')
  const [error, setError] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<Hex | null>(null)
  const [newId, setNewId] = useState<bigint | null>(null)

  const resolvesAtSeconds = resolveDate ? Math.floor(new Date(resolveDate).getTime() / 1000) : 0
  const canReview = text.trim().length >= 12 && criteria.trim().length >= 8 && resolvesAtSeconds > Date.now() / 1000

  const publish = async () => {
    if (!address) return
    setError(null)
    setStep('committing')
    try {
      const salt = randomSalt()
      const commitment = computeCommitment(text.trim(), criteria.trim(), salt)

      const commitHash = await commit({
        commitment,
        resolvesAt: resolvesAtSeconds,
        confidence,
        visibility,
        resolver: address, // self-resolved by default; changing the resolver is a v2 surface
        category,
      })
      setTxHash(commitHash)
      const receipt = await publicClient!.waitForTransactionReceipt({ hash: commitHash })

      const committedLog = receipt.logs
        .map((log) => {
          try {
            return decodeEventLog({ abi: PACT_REGISTRY_ABI, ...log })
          } catch {
            return null
          }
        })
        .find((event) => event?.eventName === 'Committed')
      const id = committedLog && 'args' in committedLog ? (committedLog.args as { id: bigint }).id : null
      if (!id) throw new Error('Could not read the new prediction id from the transaction.')
      setNewId(id)

      storeSalt(id.toString(), text.trim(), criteria.trim(), salt, reasoning.trim())

      // An OPEN prediction reveals immediately — its whole value is public timing, not
      // secrecy, so leaving it unrevealed would just be an unnecessary extra step later.
      if (visibility === 'OPEN') {
        const revealHash = await reveal({ id, text: text.trim(), criteria: criteria.trim(), salt, reasoning: reasoning.trim() })
        await publicClient!.waitForTransactionReceipt({ hash: revealHash })
      }

      setStep('done')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Something went wrong publishing this.')
      setStep('review')
    }
  }

  if (step === 'done' && newId !== null) {
    return (
      <main className="mx-auto max-w-lg px-6 py-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-signal-correct/15">
          <Lock aria-hidden className="h-7 w-7 text-signal-correct" />
        </div>
        <h1 className="mt-5 text-title text-chalk">Locked on Monad</h1>
        <p className="mt-2 text-small leading-relaxed text-chalk-muted">
          Prediction #{newId.toString()} is committed. Nobody, including you, can change what it says without
          the change being detectable.
        </p>
        <div className="mt-6 flex flex-col gap-2.5">
          <Button size="lg" onClick={() => router.push(`/p/${newId}`)}>
            View proof
          </Button>
          {txHash && (
            <a
              href={explorerTxUrl(txHash)}
              target="_blank"
              rel="noreferrer noopener"
              className="text-[0.75rem] text-chalk-faint underline underline-offset-4"
            >
              View transaction on Monadscan
            </a>
          )}
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-lg px-6 pb-24">
      <header className="flex items-center justify-between py-5">
        <Link href="/" className="flex h-10 w-10 items-center justify-center rounded-full text-chalk-muted active:bg-white/10">
          <ArrowLeft aria-hidden className="h-5 w-5" />
        </Link>
        <WalletButton />
      </header>

      <h1 className="text-display text-chalk">
        {step === 'review' ? 'Review before you sign' : 'Make the call'}
      </h1>

      {step === 'form' && (
        <div className="mt-6 space-y-5">
          <Field label="Your prediction" hint="What exactly will happen. Be specific — this is what gets locked.">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              maxLength={280}
              placeholder="ETH closes above $5,000 before December 31, 2026"
              className="w-full rounded-xl border border-white/[0.09] bg-black/30 px-3.5 py-3 text-body text-chalk placeholder:text-chalk-faint focus:border-monad/50 focus:outline-none"
            />
          </Field>

          <Field label="Resolution criteria" hint="Exactly how this gets judged true or false, precisely enough that a stranger could resolve it.">
            <textarea
              value={criteria}
              onChange={(e) => setCriteria(e.target.value)}
              rows={2}
              maxLength={280}
              placeholder="CoinGecko daily close price in USD, any single day before the deadline"
              className="w-full rounded-xl border border-white/[0.09] bg-black/30 px-3.5 py-3 text-body text-chalk placeholder:text-chalk-faint focus:border-monad/50 focus:outline-none"
            />
          </Field>

          <Field label="Reasoning (optional)" hint="Shown alongside your prediction. Not part of what's hashed or verified.">
            <textarea
              value={reasoning}
              onChange={(e) => setReasoning(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="Why you think this"
              className="w-full rounded-xl border border-white/[0.09] bg-black/30 px-3.5 py-3 text-body text-chalk placeholder:text-chalk-faint focus:border-monad/50 focus:outline-none"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="h-11 w-full rounded-xl border border-white/[0.09] bg-black/30 px-3 text-small text-chalk focus:border-monad/50 focus:outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} className="bg-ink-850">
                    {c.charAt(0) + c.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Resolves">
              <input
                type="date"
                value={resolveDate}
                min={new Date(Date.now() + 86_400_000).toISOString().slice(0, 10)}
                onChange={(e) => setResolveDate(e.target.value)}
                className="h-11 w-full rounded-xl border border-white/[0.09] bg-black/30 px-3 text-small text-chalk focus:border-monad/50 focus:outline-none"
              />
            </Field>
          </div>

          <Field label={`Confidence — ${confidence}%`} hint="How sure you are. This is checked against reality later, not just displayed.">
            <input
              type="range"
              min={1}
              max={100}
              value={confidence}
              onChange={(e) => setConfidence(Number(e.target.value))}
              className="w-full accent-monad"
            />
          </Field>

          <Field label="Visibility">
            <div className="grid grid-cols-2 gap-2.5">
              <VisibilityOption
                icon={Eye}
                active={visibility === 'OPEN'}
                title="Open"
                body="Published immediately"
                onClick={() => setVisibility('OPEN')}
              />
              <VisibilityOption
                icon={Lock}
                active={visibility === 'SEALED'}
                title="Sealed"
                body="Hidden until you reveal it"
                onClick={() => setVisibility('SEALED')}
              />
            </div>
          </Field>

          <Button size="lg" fullWidth disabled={!canReview} onClick={() => setStep('review')}>
            Review
          </Button>
        </div>
      )}

      {step === 'review' && (
        <div className="mt-6 space-y-4">
          <div className="surface px-5 py-5">
            <div className="flex items-start gap-2">
              <Info aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-monad-bright" />
              <p className="text-[0.75rem] leading-relaxed text-chalk-muted">
                This is exactly what becomes immutable. {visibility === 'SEALED' ? 'The text below stays hidden until you reveal it — only its hash is committed now.' : 'This will be published and timestamped immediately.'}
              </p>
            </div>
          </div>

          <ReviewRow label="Prediction" value={text} />
          <ReviewRow label="Resolution criteria" value={criteria} />
          <ReviewRow label="Category" value={category} />
          <ReviewRow label="Confidence" value={`${confidence}%`} />
          <ReviewRow label="Resolves" value={new Date(resolvesAtSeconds * 1000).toLocaleDateString()} />
          <ReviewRow label="Visibility" value={visibility === 'OPEN' ? 'Open — public now' : 'Sealed — hidden until revealed'} />
          <ReviewRow label="Resolver" value="You (self-resolved — shown as such everywhere)" />

          {error && (
            <div className="rounded-xl border border-signal-incorrect/30 bg-signal-incorrect/10 px-4 py-3 text-[0.75rem] text-signal-incorrect">
              {error}
            </div>
          )}

          {!isConnected ? (
            <div className="rounded-xl border border-white/[0.08] px-4 py-4 text-center">
              <p className="mb-3 text-small text-chalk-muted">Connect your wallet to sign this.</p>
              <WalletButton />
            </div>
          ) : (
            <Button
              size="lg"
              fullWidth
              busy={committing || confirmingCommit || revealing || confirmingReveal}
              onClick={() => void publish()}
            >
              {committing || confirmingCommit
                ? 'Confirming on Monad…'
                : revealing || confirmingReveal
                  ? 'Revealing…'
                  : 'Sign & commit'}
            </Button>
          )}
          <button
            type="button"
            onClick={() => setStep('form')}
            className="w-full text-center text-small text-chalk-faint underline underline-offset-4"
          >
            Edit
          </button>
        </div>
      )}
    </main>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-small font-medium text-chalk">{label}</label>
      <div className="mt-1.5">{children}</div>
      {hint && <p className="mt-1.5 text-[0.7rem] leading-relaxed text-chalk-faint">{hint}</p>}
    </div>
  )
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface-quiet px-4 py-3">
      <p className="text-micro uppercase tracking-wider text-chalk-faint">{label}</p>
      <p className="mt-1 text-small leading-relaxed text-chalk">{value}</p>
    </div>
  )
}

function VisibilityOption({
  icon: Icon,
  active,
  title,
  body,
  onClick,
}: {
  icon: typeof Eye
  active: boolean
  title: string
  body: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-3.5 py-3 text-left transition-colors ${
        active ? 'border-monad/50 bg-monad/10' : 'border-white/[0.08] bg-white/[0.02]'
      }`}
    >
      <Icon aria-hidden className={`h-4 w-4 ${active ? 'text-monad-bright' : 'text-chalk-faint'}`} />
      <p className="mt-2 text-small font-medium text-chalk">{title}</p>
      <p className="text-[0.7rem] text-chalk-faint">{body}</p>
    </button>
  )
}
