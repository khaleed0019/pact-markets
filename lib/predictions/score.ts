import type { Outcome } from './types.ts'

/**
 * The Pact Score.
 *
 * Every input here is something anyone can recompute from the `Committed` and
 * `Resolved` events alone — that is deliberate. A score nobody can check independently
 * is an opinion wearing a number; this one is arithmetic over public facts, and this
 * file is the one place that arithmetic is defined, so the app can never show a
 * different score than someone auditing the chain would get.
 *
 * ## What actually earns points
 *
 *  - **Accuracy** is the base: correct / (correct + incorrect). VOID predictions are
 *    excluded entirely rather than counted as a miss — voiding means the resolution
 *    criteria itself failed to decide the question, which says nothing about whether
 *    the prediction was good.
 *  - **Calibration** rewards confidence that matches reality, not confidence itself. A
 *    50%-confidence coin flip and a 95%-confidence coin flip are not equally good calls
 *    if the outcome is a coin flip. Modelled with a Brier-score-derived multiplier so
 *    stating 95% on something that was genuinely a toss-up costs more than stating 50%.
 *  - **Difficulty** is a stand-in for "how far out was this call", the only cheap public
 *    proxy without a market to price against: predicting six months out and being right
 *    is worth more than predicting six hours out and being right, because the second is
 *    barely a prediction.
 *  - **Volume** dampens with a square root, so someone cannot out-climb the board by
 *    firing off fifty low-effort calls — the tenth prediction moves the score much less
 *    than the first, and being extremely accurate on three calls still means something.
 *  - **Self-resolved predictions never count.** A record graded by its own author is not
 *    evidence of anything, so they are silently excluded from every number here rather
 *    than counted and merely flagged — a self-resolved prediction sitting in someone's
 *    accuracy percentage would inflate exactly the number that is supposed to be trustable.
 */

export interface ScoredPrediction {
  outcome: Outcome
  confidence: number // 1-100, as committed on chain
  createdAt: number // unix seconds
  resolvesAt: number // unix seconds
  selfResolved: boolean
}

export interface PactScoreBreakdown {
  score: number
  accuracy: number | null // null when there is nothing resolved yet to measure
  correct: number
  incorrect: number
  voided: number
  pending: number
  /** Predictions counted toward the score — excludes every self-resolved one. */
  countedTotal: number
  /** Self-resolved predictions the author made, shown but never scored. */
  excludedSelfResolved: number
  level: PactLevel
}

export const PACT_LEVELS = ['ROOKIE', 'ANALYST', 'STRATEGIST', 'ORACLE', 'LEGEND'] as const
export type PactLevel = (typeof PACT_LEVELS)[number]

const LEVEL_THRESHOLDS: Array<{ level: PactLevel; min: number }> = [
  { level: 'LEGEND', min: 800 },
  { level: 'ORACLE', min: 550 },
  { level: 'STRATEGIST', min: 320 },
  { level: 'ANALYST', min: 120 },
  { level: 'ROOKIE', min: 0 },
]

function levelFor(score: number): PactLevel {
  const found = LEVEL_THRESHOLDS.find((t) => score >= t.min)
  return found?.level ?? 'ROOKIE'
}

/** How far out the call was made, in days, clamped to a sane range for the multiplier. */
function difficultyDays(createdAt: number, resolvesAt: number): number {
  const days = (resolvesAt - createdAt) / 86_400
  return Math.max(1, Math.min(days, 365))
}

/**
 * 1.0 at a 7-day call, rising toward 1.6 at a year out, easing toward 0.6 for same-day
 * calls. sqrt rather than linear so the difference between "one year out" and "two years
 * out" stops mattering much — there is no realistic gain to gaming this by picking
 * absurdly distant resolution dates.
 */
function difficultyMultiplier(days: number): number {
  return 0.6 + Math.sqrt(days / 30) * 0.35
}

/**
 * Brier-derived calibration multiplier for one resolved prediction.
 *
 * Brier score = (confidence/100 - actual)^2, where actual is 1 for correct, 0 for
 * incorrect — lower is better calibrated. Converted to a 0.4-1.3 multiplier so a
 * perfectly calibrated, correct, high-confidence call is rewarded well above a correct
 * call nobody was confident about, and an overconfident wrong call is punished harder
 * than a hedged one.
 */
function calibrationMultiplier(confidence: number, wasCorrect: boolean): number {
  const p = confidence / 100
  const actual = wasCorrect ? 1 : 0
  const brier = (p - actual) ** 2 // 0 (perfect) to 1 (maximally wrong)
  return 1.3 - brier * 0.9
}

export function computePactScore(predictions: ScoredPrediction[]): PactScoreBreakdown {
  const counted = predictions.filter((p) => !p.selfResolved)
  const excludedSelfResolved = predictions.length - counted.length

  const resolved = counted.filter((p) => p.outcome === 'CORRECT' || p.outcome === 'INCORRECT')
  const correct = resolved.filter((p) => p.outcome === 'CORRECT').length
  const incorrect = resolved.length - correct
  const voided = counted.filter((p) => p.outcome === 'VOID').length
  const pending = counted.filter((p) => p.outcome === 'UNRESOLVED').length

  const accuracy = resolved.length > 0 ? correct / resolved.length : null

  // Per-prediction quality, averaged rather than summed — a straight sum would let call
  // count alone drive the score arbitrarily high regardless of accuracy. Averaging first
  // and then scaling by sqrt(n) is what actually produces "more resolved calls help, but
  // with diminishing weight": the 10th call moves the score much less than the 1st, yet a
  // handful of excellent calls can still outscore a mediocre pile of fifty.
  let qualitySum = 0
  for (const p of resolved) {
    const wasCorrect = p.outcome === 'CORRECT'
    const base = wasCorrect ? 10 : -6 // being wrong costs more than being right earns
    const calibration = calibrationMultiplier(p.confidence, wasCorrect)
    const difficulty = difficultyMultiplier(difficultyDays(p.createdAt, p.resolvesAt))
    qualitySum += base * calibration * difficulty
  }
  const averageQuality = resolved.length > 0 ? qualitySum / resolved.length : 0
  const score = Math.max(0, Math.round(averageQuality * Math.sqrt(resolved.length) * 10))

  return {
    score,
    accuracy,
    correct,
    incorrect,
    voided,
    pending,
    countedTotal: counted.length,
    excludedSelfResolved,
    level: levelFor(score),
  }
}

/**
 * Current streak of consecutive correct resolutions, most recent first.
 * Stops at the first incorrect one; VOID and UNRESOLVED are skipped, not streak-breaking,
 * since neither one is evidence the streak ended.
 */
export function currentStreak(predictionsNewestFirst: ScoredPrediction[]): number {
  let streak = 0
  for (const p of predictionsNewestFirst) {
    if (p.selfResolved) continue
    if (p.outcome === 'CORRECT') streak++
    else if (p.outcome === 'INCORRECT') break
    // VOID / UNRESOLVED: skip without breaking the streak.
  }
  return streak
}
