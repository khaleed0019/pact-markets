'use client'

import { useState } from 'react'
import { Share2, Check, Link as LinkIcon } from 'lucide-react'
import type { Outcome } from '@/lib/predictions/types'

const OUTCOME_PHRASE: Record<Outcome, string> = {
  UNRESOLVED: 'Locked in on chain, before anyone knows how this plays out.',
  CORRECT: 'Called it — and it was timestamped before the fact, not after.',
  INCORRECT: "Got this one wrong — and it's on the record, not quietly deleted.",
  VOID: "This one's criteria never actually decided the question.",
}

/**
 * Turns a proof page into something worth posting. The link itself carries the proof —
 * `/p/[id]`'s own opengraph-image.tsx renders the real prediction into the link preview,
 * so the card a viewer sees on X or Discord is the same commitment hash and outcome this
 * page shows, not a separately-generated image that could quietly drift from the truth.
 */
export function ShareProofButton({ id, outcome, text }: { id: bigint; outcome: Outcome; text: string | null }) {
  const [copied, setCopied] = useState(false)

  const url = typeof window !== 'undefined' ? window.location.href : ''
  const shareText = `${OUTCOME_PHRASE[outcome]}${text ? `\n\n"${text}"` : ''}\n\nVerify the timestamp:`

  const copyLink = async () => {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const shareToX = () => {
    const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`
    window.open(intent, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="mt-4 flex gap-2">
      <button
        type="button"
        onClick={shareToX}
        className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.03] text-small font-medium text-chalk active:bg-white/[0.07]"
      >
        <Share2 aria-hidden className="h-3.5 w-3.5" />
        Share proof
      </button>
      <button
        type="button"
        onClick={() => void copyLink()}
        aria-label="Copy link"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.09] bg-white/[0.03] text-chalk-muted active:bg-white/[0.07]"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-signal-correct" /> : <LinkIcon className="h-3.5 w-3.5" />}
      </button>
    </div>
  )
}
