import test from 'node:test'
import assert from 'node:assert/strict'
import { computePactScore, currentStreak, type ScoredPrediction } from '../lib/predictions/score.ts'

/**
 * The score is the product's central claim — "this number reflects real track record" —
 * so these pin the properties that claim actually depends on, not just example outputs.
 */

const DAY = 86_400
const now = Math.floor(Date.now() / 1000)

function prediction(overrides: Partial<ScoredPrediction> = {}): ScoredPrediction {
  return {
    outcome: 'CORRECT',
    confidence: 70,
    createdAt: now - 30 * DAY,
    resolvesAt: now,
    selfResolved: false,
    ...overrides,
  }
}

test('someone with nothing resolved has no accuracy figure, not a zero', () => {
  const breakdown = computePactScore([prediction({ outcome: 'UNRESOLVED' })])
  assert.equal(breakdown.accuracy, null, 'zero would look like "always wrong" rather than "unproven"')
  assert.equal(breakdown.score, 0)
  assert.equal(breakdown.level, 'ROOKIE')
})

test('self-resolved predictions never affect the score, even when they are the only data', () => {
  const onlySelfResolved = computePactScore([prediction({ selfResolved: true })])
  assert.equal(onlySelfResolved.score, 0)
  assert.equal(onlySelfResolved.accuracy, null)
  assert.equal(onlySelfResolved.excludedSelfResolved, 1)
  assert.equal(onlySelfResolved.countedTotal, 0)

  // And mixed in with real ones, it changes nothing about the real accuracy figure.
  const withReal = computePactScore([
    prediction({ selfResolved: true, outcome: 'INCORRECT' }), // would tank accuracy if counted
    prediction({ outcome: 'CORRECT' }),
  ])
  assert.equal(withReal.accuracy, 1, 'the self-resolved miss must not appear in accuracy at all')
})

test('being right scores strictly more than being wrong, all else equal', () => {
  const right = computePactScore([prediction({ outcome: 'CORRECT' })])
  const wrong = computePactScore([prediction({ outcome: 'INCORRECT' })])
  assert.ok(right.score > wrong.score)
  assert.equal(wrong.score, 0, 'score is clamped at zero rather than going negative')
})

test('VOID predictions are excluded from accuracy, not counted as a miss', () => {
  const breakdown = computePactScore([
    prediction({ outcome: 'CORRECT' }),
    prediction({ outcome: 'VOID' }),
  ])
  assert.equal(breakdown.accuracy, 1, 'the voided one must not drag accuracy down')
  assert.equal(breakdown.voided, 1)
})

test('a correct, well-calibrated, high-confidence call outscores a hedged one', () => {
  const confident = computePactScore([prediction({ outcome: 'CORRECT', confidence: 95 })])
  const hedged = computePactScore([prediction({ outcome: 'CORRECT', confidence: 55 })])
  assert.ok(confident.score > hedged.score, 'stating high confidence and being right should be worth more')
})

test('an overconfident wrong call is punished harder than a hedged wrong call', () => {
  const overconfidentWrong = computePactScore([prediction({ outcome: 'INCORRECT', confidence: 95 })])
  const hedgedWrong = computePactScore([prediction({ outcome: 'INCORRECT', confidence: 55 })])
  assert.ok(
    overconfidentWrong.score <= hedgedWrong.score,
    'being confidently wrong must not score better than being hesitantly wrong',
  )
})

test('a longer-horizon correct call outscores a same-quality short one', () => {
  const longHorizon = computePactScore([
    prediction({ outcome: 'CORRECT', createdAt: now - 200 * DAY, resolvesAt: now }),
  ])
  const shortHorizon = computePactScore([
    prediction({ outcome: 'CORRECT', createdAt: now - DAY, resolvesAt: now }),
  ])
  assert.ok(longHorizon.score > shortHorizon.score)
})

test('score grows with more correct calls, but less than linearly', () => {
  const one = computePactScore([prediction({ outcome: 'CORRECT' })])
  const ten = computePactScore(Array.from({ length: 10 }, () => prediction({ outcome: 'CORRECT' })))
  assert.ok(ten.score > one.score, 'more evidence of the same quality should score higher')
  assert.ok(
    ten.score < one.score * 10,
    'ten identical calls must not score ten times a single one — volume dampens, it does not multiply',
  )
})

test('streak counts consecutive corrects from most recent, and stops at the first miss', () => {
  const streak = currentStreak([
    prediction({ outcome: 'CORRECT' }),
    prediction({ outcome: 'CORRECT' }),
    prediction({ outcome: 'VOID' }), // does not break it
    prediction({ outcome: 'UNRESOLVED' }), // does not break it
    prediction({ outcome: 'CORRECT' }),
    prediction({ outcome: 'INCORRECT' }), // ends it
    prediction({ outcome: 'CORRECT' }),
  ])
  assert.equal(streak, 3)
})

test('a self-resolved correct call does not inflate the streak', () => {
  const streak = currentStreak([
    prediction({ outcome: 'CORRECT', selfResolved: true }),
    prediction({ outcome: 'CORRECT', selfResolved: true }),
  ])
  assert.equal(streak, 0)
})
