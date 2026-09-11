import { computeCommitment } from './commitment.ts'
import { deriveLifecycle, type Category, type Outcome, type Prediction, type Visibility } from './types.ts'

/**
 * Live Demo Mode data.
 *
 * This exists for exactly one reason: a judge should be able to see the whole product —
 * Discover, Leaderboard, a real profile with a real Pact Score — in the ~90 seconds they
 * actually spend on a hackathon submission, without first needing testnet MON and a
 * wallet extension installed. It is never a substitute for the real thing: every card
 * built from this file is labeled DEMO everywhere it renders (see `DemoBanner` and
 * `PredictionCard`'s `demo` prop), and none of these ids resolve on `/p/[id]` — clicking
 * one shows that honestly rather than pointing at a page that would look like real chain
 * state and isn't.
 *
 * Commitments below ARE real `keccak256(abi.encode(text, criteria, salt))` values,
 * computed with the same function the real create flow uses — so "here's what a
 * commitment hash looks like" is accurate even though these specific hashes were never
 * actually submitted to Monad.
 */

const DEMO_AUTHORS = [
  '0x13eDd4610079433Ac766DfA9902dCc350fF68322',
  '0x2c26E8e2A4Ae606a2C26E8e2A4Ae606a2C26E8e2',
  '0x78B2daBe50De183014B6347E967a1C9ad4Fcd072',
] as const

const DAY = 86_400
const now = () => Math.floor(Date.now() / 1000)

function salt(seed: string): `0x${string}` {
  const bytes = new TextEncoder().encode(seed.padEnd(32, '.')).slice(0, 32)
  return `0x${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}` as `0x${string}`
}

interface Seed {
  id: number
  author: `0x${string}`
  text: string
  criteria: string
  reasoning: string
  category: Category
  confidence: number
  visibility: Visibility
  daysAgo: number // when it was committed
  resolvesInDays: number // relative to commit time
  outcome: Outcome
  revealed: boolean
  selfResolved: boolean
}

const SEEDS: Seed[] = [
  {
    id: 9001,
    author: DEMO_AUTHORS[0],
    text: 'MON/USD trades above $0.08 on at least one CEX before Nov 1, 2026',
    criteria: 'Any 1-minute candle close on Binance or OKX MON/USDT, converted at same-minute USDT/USD.',
    reasoning: 'Testnet activity and mainnet anticipation tend to front-run listings.',
    category: 'CRYPTO',
    confidence: 72,
    visibility: 'OPEN',
    daysAgo: 34,
    resolvesInDays: 20,
    outcome: 'CORRECT',
    revealed: true,
    selfResolved: false,
  },
  {
    id: 9002,
    author: DEMO_AUTHORS[0],
    text: 'A top-5 EVM L1 by TVL announces a Monad-equivalent parallel execution roadmap by Q1 2027',
    criteria: 'Official blog post or governance proposal naming parallel EVM execution as a shipped roadmap item.',
    reasoning: '',
    category: 'TECHNOLOGY',
    confidence: 55,
    visibility: 'OPEN',
    daysAgo: 61,
    resolvesInDays: 40,
    outcome: 'INCORRECT',
    revealed: true,
    selfResolved: false,
  },
  {
    id: 9003,
    author: DEMO_AUTHORS[0],
    text: 'Monad Metropolis Hackathon receives over 1,000 registered teams',
    criteria: 'Official registration count published by Monad Foundation at the registration deadline.',
    reasoning: 'Prize pool size and EVM-equivalence make onboarding unusually low-friction.',
    category: 'TECHNOLOGY',
    confidence: 80,
    visibility: 'OPEN',
    daysAgo: 20,
    resolvesInDays: 6,
    outcome: 'UNRESOLVED', // still waiting — deadline passed, not yet resolved
    revealed: true,
    selfResolved: false,
  },
  {
    id: 9004,
    author: DEMO_AUTHORS[1],
    text: 'Fed holds rates unchanged at the next FOMC meeting',
    criteria: 'Federal Reserve press release following the scheduled FOMC meeting.',
    reasoning: '',
    category: 'FINANCE',
    confidence: 64,
    visibility: 'OPEN',
    daysAgo: 45,
    resolvesInDays: 30,
    outcome: 'CORRECT',
    revealed: true,
    selfResolved: false,
  },
  {
    id: 9005,
    author: DEMO_AUTHORS[1],
    text: 'A major streaming platform cancels a flagship show mid-season',
    criteria: 'Trade press (Variety, THR, Deadline) reporting cancellation before the season finishes airing.',
    reasoning: '',
    category: 'CULTURE',
    confidence: 40,
    visibility: 'OPEN',
    daysAgo: 70,
    resolvesInDays: 50,
    outcome: 'VOID',
    revealed: true,
    selfResolved: false,
  },
  {
    id: 9006,
    author: DEMO_AUTHORS[1],
    text: 'Manchester City finish the season with fewer than 60 points',
    criteria: 'Final Premier League table points total.',
    reasoning: 'Squad depth issues visible since August.',
    category: 'SPORTS',
    confidence: 58,
    visibility: 'OPEN',
    daysAgo: 15,
    resolvesInDays: -5, // already resolved before "now" in relative demo time — waiting state
    outcome: 'UNRESOLVED',
    revealed: true,
    selfResolved: true, // demonstrates the self-resolved warning without needing a second wallet
  },
  {
    id: 9007,
    author: DEMO_AUTHORS[2],
    text: 'A large-cap AI lab ships a model with a publicly disclosed context window over 5M tokens',
    criteria: 'Official model card or release notes stating the context window size.',
    reasoning: '',
    category: 'TECHNOLOGY',
    confidence: 90,
    visibility: 'OPEN',
    daysAgo: 90,
    resolvesInDays: 75,
    outcome: 'CORRECT',
    revealed: true,
    selfResolved: false,
  },
  {
    id: 9008,
    author: DEMO_AUTHORS[2],
    text: 'BTC dominance falls below 45% before year end',
    criteria: 'CoinGecko BTC dominance metric, any daily close.',
    reasoning: '',
    category: 'CRYPTO',
    confidence: 35,
    visibility: 'OPEN',
    daysAgo: 25,
    resolvesInDays: 15,
    outcome: 'INCORRECT',
    revealed: true,
    selfResolved: false,
  },
  {
    id: 9009,
    author: DEMO_AUTHORS[2],
    text: 'A confidential prediction, sealed pending a private research release',
    criteria: 'Sealed — criteria withheld until reveal.',
    reasoning: '',
    category: 'FINANCE',
    confidence: 68,
    visibility: 'SEALED',
    daysAgo: 3,
    resolvesInDays: 25,
    outcome: 'UNRESOLVED',
    revealed: false,
    selfResolved: false,
  },
]

export function buildDemoPredictions(): Prediction[] {
  const nowMs = Date.now()
  return SEEDS.map((seed) => {
    const createdAt = BigInt(now() - seed.daysAgo * DAY)
    const resolvesAt = BigInt(now() - seed.daysAgo * DAY + seed.resolvesInDays * DAY)
    const s = salt(`demo-${seed.id}`)
    const commitment = computeCommitment(seed.text, seed.criteria, s)
    const onChain = {
      id: BigInt(seed.id),
      author: seed.author,
      commitment,
      createdAt,
      resolvesAt,
      confidence: seed.confidence,
      visibility: seed.visibility,
      outcome: seed.outcome,
      revealed: seed.revealed,
      resolver: seed.author,
    }
    return {
      ...onChain,
      content: seed.revealed
        ? { text: seed.text, criteria: seed.criteria, category: seed.category, tags: [], reasoning: seed.reasoning }
        : null,
      selfResolved: seed.selfResolved,
      lifecycle: deriveLifecycle(onChain, nowMs),
    }
  })
}

export function isDemoId(id: bigint): boolean {
  return id >= 9000n && id < 10000n
}
