import { computePactScore, currentStreak, type ScoredPrediction } from './score.ts'
import type { Prediction } from './types.ts'

/**
 * Turns a flat list of predictions (from `useAllPredictions`) into one row per author —
 * the shape both the leaderboard and a profile page need. Built on the same
 * `computePactScore` the score page itself uses, so a leaderboard rank and a profile's
 * own number are always the same arithmetic, never two implementations drifting apart.
 */
export interface LeaderboardEntry {
  author: `0x${string}`
  predictions: Prediction[]
  score: ReturnType<typeof computePactScore>
  streak: number
}

function toScored(p: Prediction): ScoredPrediction {
  return {
    outcome: p.outcome,
    confidence: p.confidence,
    createdAt: Number(p.createdAt),
    resolvesAt: Number(p.resolvesAt),
    selfResolved: p.selfResolved,
  }
}

export function buildLeaderboard(predictions: Prediction[]): LeaderboardEntry[] {
  const byAuthor = new Map<string, Prediction[]>()
  for (const p of predictions) {
    const key = p.author.toLowerCase()
    const list = byAuthor.get(key)
    if (list) list.push(p)
    else byAuthor.set(key, [p])
  }

  const entries: LeaderboardEntry[] = []
  for (const [, list] of byAuthor) {
    // Newest first, matching how `useAllPredictions` already sorts — `currentStreak`
    // depends on that order to count backward from "most recent" correctly.
    const sorted = [...list].sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1))
    const scored = sorted.map(toScored)
    entries.push({
      author: sorted[0]!.author,
      predictions: sorted,
      score: computePactScore(scored),
      streak: currentStreak(scored),
    })
  }

  // Ranked by score first, so volume alone never outranks quality; ties broken by who
  // has more predictions counted, so an equal score with a longer track record ranks
  // above the same score proven over fewer calls.
  entries.sort((a, b) => b.score.score - a.score.score || b.score.countedTotal - a.score.countedTotal)
  return entries
}

export function predictionsFor(predictions: Prediction[], author: `0x${string}`): Prediction[] {
  const key = author.toLowerCase()
  return predictions
    .filter((p) => p.author.toLowerCase() === key)
    .sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1))
}
