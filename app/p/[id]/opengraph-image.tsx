import { ImageResponse } from 'next/og'
import { readPredictionForCard } from '@/lib/chain/serverRead'
import { buildDemoPredictions, isDemoId } from '@/lib/predictions/demoData'
import type { Outcome } from '@/lib/predictions/types'

export const alt = 'PACT MARKETS — Proof of Prediction'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const OUTCOME_STYLE: Record<Outcome, { label: string; color: string }> = {
  UNRESOLVED: { label: 'LOCKED', color: '#E8A93A' },
  CORRECT: { label: 'CORRECT', color: '#33D17A' },
  INCORRECT: { label: 'INCORRECT', color: '#F0524B' },
  VOID: { label: 'VOID', color: '#6B7284' },
}

function short(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}

/**
 * The shareable proof card. This is what renders when a `/p/[id]` link is pasted into
 * X, Discord, or iMessage — real data or nothing, the same rule as everywhere else in
 * this app. A prediction that fails to load (bad id, no deployment, RPC hiccup) gets a
 * generic branded card, never a fabricated-looking one with placeholder text that could
 * be mistaken for a real claim.
 */
export default async function Image({ params }: { params: { id: string } }) {
  let id: bigint | null = null
  try {
    id = BigInt(params.id)
  } catch {
    id = null
  }

  const summary =
    id !== null && isDemoId(id)
      ? (() => {
          const demo = buildDemoPredictions().find((p) => p.id === id)
          return demo
            ? {
                author: demo.author,
                outcome: demo.outcome,
                visibility: demo.visibility,
                confidence: demo.confidence,
                revealed: demo.revealed,
                text: demo.content?.text ?? null,
              }
            : null
        })()
      : id !== null
        ? await readPredictionForCard(id)
        : null

  const outcomeStyle = OUTCOME_STYLE[summary?.outcome ?? 'UNRESOLVED']
  const isDemo = id !== null && isDemoId(id)

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 72,
          backgroundColor: '#05060A',
          backgroundImage: 'radial-gradient(circle at 78% 12%, rgba(131,110,249,0.28), rgba(5,6,10,0) 55%)',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: 999,
                backgroundColor: '#836EF9',
                boxShadow: '0 0 24px 4px rgba(131,110,249,0.7)',
              }}
            />
            <span style={{ fontSize: 28, fontWeight: 700, color: '#F3F4F7', letterSpacing: -0.5 }}>
              PACT MARKETS
            </span>
          </div>
          {summary && (
            <div
              style={{
                display: 'flex',
                padding: '8px 18px',
                borderRadius: 999,
                border: `2px solid ${outcomeStyle.color}55`,
                backgroundColor: `${outcomeStyle.color}1A`,
                color: outcomeStyle.color,
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: 2,
              }}
            >
              {outcomeStyle.label}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <span style={{ fontSize: 20, fontWeight: 600, letterSpacing: 3, color: '#A196FC', textTransform: 'uppercase' }}>
            Proof of Prediction #{id?.toString() ?? '—'}
          </span>
          <span
            style={{
              fontSize: summary?.text && summary.text.length > 90 ? 46 : 58,
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: -1,
              color: '#F3F4F7',
              maxWidth: 980,
              display: 'block',
            }}
          >
            {summary?.text ??
              (summary?.revealed === false ? 'Sealed — text hidden until revealed' : "Don't trust the call. Verify the timestamp.")}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 28, fontSize: 22, color: '#9AA1B2' }}>
            {summary && (
              <span style={{ display: 'flex' }}>
                {short(summary.author)} · {summary.confidence}% confidence
              </span>
            )}
          </div>
          <span style={{ fontSize: 22, color: isDemo ? '#A196FC' : '#5C6478' }}>
            {isDemo ? 'Demo data · not on chain' : summary ? 'Monad Testnet · verified on chain' : 'Monad Testnet'}
          </span>
        </div>
      </div>
    ),
    { ...size },
  )
}
