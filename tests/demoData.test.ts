import test from 'node:test'
import assert from 'node:assert/strict'
import { buildDemoPredictions, isDemoId } from '../lib/predictions/demoData.ts'
import { buildLeaderboard } from '../lib/predictions/aggregate.ts'

/**
 * Live Demo Mode is the first thing many judges will actually click through, so its data
 * has to satisfy the same shape invariants real chain data would — an invalid address or
 * an inconsistent lifecycle here would be a visibly broken demo, not just a test failure.
 */

test('every demo author is a well-formed 0x address', () => {
  const predictions = buildDemoPredictions()
  assert.ok(predictions.length > 0)
  for (const p of predictions) {
    assert.match(p.author, /^0x[0-9a-fA-F]{40}$/, `bad author on demo prediction ${p.id}`)
  }
})

test('every demo prediction id is recognized as a demo id, and nothing else is', () => {
  const predictions = buildDemoPredictions()
  for (const p of predictions) {
    assert.equal(isDemoId(p.id), true)
  }
  assert.equal(isDemoId(1n), false)
  assert.equal(isDemoId(8999n), false)
  assert.equal(isDemoId(10000n), false)
})

test('a resolved demo prediction always reports lifecycle RESOLVED, an unresolved one never does', () => {
  const predictions = buildDemoPredictions()
  for (const p of predictions) {
    if (p.outcome === 'UNRESOLVED') {
      assert.notEqual(p.lifecycle, 'RESOLVED')
    } else {
      assert.equal(p.lifecycle, 'RESOLVED')
    }
  }
})

test('the self-resolved demo prediction is excluded from its author\'s score, not silently counted', () => {
  const predictions = buildDemoPredictions()
  const selfResolved = predictions.filter((p) => p.selfResolved)
  assert.ok(selfResolved.length > 0, 'fixture should include at least one self-resolved demo prediction')

  const leaderboard = buildLeaderboard(predictions)
  const author = selfResolved[0]!.author.toLowerCase()
  const entry = leaderboard.find((e) => e.author.toLowerCase() === author)
  assert.ok(entry)
  assert.ok(entry!.score.excludedSelfResolved >= 1)
})

test('the leaderboard built from demo data is sorted by score, descending', () => {
  const entries = buildLeaderboard(buildDemoPredictions())
  for (let i = 1; i < entries.length; i++) {
    assert.ok(entries[i - 1]!.score.score >= entries[i]!.score.score)
  }
})
