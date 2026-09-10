/**
 * PACT MARKETS domain types.
 *
 * `PredictionOnChain` mirrors the Solidity struct field for field — see
 * contracts/PactRegistry.sol for what each one actually means and why. `Prediction`
 * is the hydrated shape the app renders: on-chain fact plus the off-chain text that
 * fact commits to, once known.
 */

export const VISIBILITIES = ['OPEN', 'SEALED'] as const
export type Visibility = (typeof VISIBILITIES)[number]

export const OUTCOMES = ['UNRESOLVED', 'CORRECT', 'INCORRECT', 'VOID'] as const
export type Outcome = (typeof OUTCOMES)[number]

export const CATEGORIES = ['CRYPTO', 'TECHNOLOGY', 'FINANCE', 'CULTURE', 'SPORTS'] as const
export type Category = (typeof CATEGORIES)[number]

/** Field order and types match the Solidity `Prediction` struct exactly. */
export interface PredictionOnChain {
  id: bigint
  author: `0x${string}`
  commitment: `0x${string}`
  createdAt: bigint
  resolvesAt: bigint
  confidence: number
  visibility: Visibility
  outcome: Outcome
  revealed: boolean
  resolver: `0x${string}`
}

/**
 * The off-chain half. Present once the prediction is revealed (immediately, for OPEN
 * ones); absent for a SEALED prediction nobody has revealed yet. Held by the app's
 * index, not the chain — the chain only ever certifies that this exact text hashes to
 * what was committed.
 */
export interface PredictionContent {
  text: string
  criteria: string
  category: Category
  tags: string[]
  reasoning: string
}

export interface Prediction extends PredictionOnChain {
  content: PredictionContent | null
  /** Convenience, derived: `resolver === author`. Surfaced everywhere self-grading matters. */
  selfResolved: boolean
  /** Convenience, derived from block time vs `resolvesAt` and `outcome`. */
  lifecycle: PredictionLifecycle
}

/**
 * Three real states, not five.
 *
 * `commit()` creates and locks a prediction in the same transaction — there is no
 * on-chain moment where a prediction exists but isn't yet locked, so a five-stage
 * CREATED → LOCKED → WAITING → RESOLVED → SCORED timeline would show two on-screen
 * steps for one actual event, twice over. The timeline component is free to *animate*
 * "created" and "locked" as one beat lighting up together (and "resolved" and "reputation
 * updated" as another), but the state this type models stops at what the chain actually
 * distinguishes.
 */
export const LIFECYCLE_STAGES = ['LOCKED', 'WAITING', 'RESOLVED'] as const
export type PredictionLifecycle = (typeof LIFECYCLE_STAGES)[number]

export function deriveLifecycle(p: Pick<PredictionOnChain, 'outcome' | 'resolvesAt'>, nowMs: number): PredictionLifecycle {
  if (p.outcome !== 'UNRESOLVED') return 'RESOLVED'
  const resolvesAtMs = Number(p.resolvesAt) * 1000
  return nowMs >= resolvesAtMs ? 'WAITING' : 'LOCKED'
}
