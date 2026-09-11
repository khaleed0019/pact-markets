'use client'

import { useMemo } from 'react'
import { useAllPredictions } from './useAllPredictions.ts'
import { useDemoMode } from '@/components/DemoMode'
import { buildDemoPredictions } from '../predictions/demoData.ts'
import type { Prediction } from '../predictions/types.ts'

/**
 * The one place Discover, Leaderboard and a profile page decide between real chain data
 * and Live Demo Mode's sample data — so flipping the toggle in `DemoMode.tsx` changes
 * every browsing surface at once, consistently, rather than each page needing its own
 * branch. Demo predictions are computed fresh each render (cheap, pure) rather than
 * cached, so there's never a stale mix of the two.
 */
export function useMarketData(): { predictions: Prediction[]; loading: boolean; error: Error | null; demoMode: boolean } {
  const { demoMode } = useDemoMode()
  const real = useAllPredictions()
  const demo = useMemo(() => (demoMode ? buildDemoPredictions() : []), [demoMode])

  if (demoMode) {
    return { predictions: demo, loading: false, error: null, demoMode: true }
  }
  return { ...real, demoMode: false }
}
