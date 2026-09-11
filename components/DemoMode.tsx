'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { FlaskConical, X } from 'lucide-react'
import { PACT_REGISTRY_ADDRESS } from '@/lib/chain/monad'

interface DemoModeState {
  demoMode: boolean
  setDemoMode: (on: boolean) => void
}

const DemoModeContext = createContext<DemoModeState | null>(null)

const STORAGE_KEY = 'pact-markets:demo-mode'

/**
 * Live Demo Mode — a real requirement, not a nice-to-have: a judge should see the full
 * product in the time they actually spend on a submission, without first needing
 * testnet MON and a wallet extension. Defaults ON when the contract has no deployed
 * address to read from (nothing else would render), and OFF once a real deployment
 * exists — but the switch always stays visible and always stays a deliberate, labeled
 * choice, never a silent fallback that could be mistaken for real chain state.
 */
export function DemoModeProvider({ children }: { children: ReactNode }) {
  const [demoMode, setDemoModeState] = useState<boolean>(() => !PACT_REGISTRY_ADDRESS)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored !== null) setDemoModeState(stored === '1')
    } catch {
      // localStorage unavailable — fall back to the deployment-based default already set.
    }
    setHydrated(true)
  }, [])

  const setDemoMode = (on: boolean) => {
    setDemoModeState(on)
    try {
      localStorage.setItem(STORAGE_KEY, on ? '1' : '0')
    } catch {
      // Non-fatal — the toggle still works for the rest of this session.
    }
  }

  return (
    <DemoModeContext.Provider value={{ demoMode: hydrated ? demoMode : !PACT_REGISTRY_ADDRESS, setDemoMode }}>
      {children}
    </DemoModeContext.Provider>
  )
}

export function useDemoMode(): DemoModeState {
  const ctx = useContext(DemoModeContext)
  if (!ctx) throw new Error('useDemoMode must be used inside DemoModeProvider')
  return ctx
}

/** Shown only while demo mode is off, so it's always possible to turn back on from here. */
export function DemoToggleOn() {
  const { demoMode, setDemoMode } = useDemoMode()
  if (demoMode) return null
  return (
    <button
      type="button"
      onClick={() => setDemoMode(true)}
      className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/[0.12] px-4 py-2.5 text-[0.75rem] text-chalk-faint active:bg-white/[0.04]"
    >
      <FlaskConical aria-hidden className="h-3.5 w-3.5" />
      No wallet or testnet MON? Browse sample data instead
    </button>
  )
}

/** The unmissable label that makes demo data impossible to confuse with real chain state. */
export function DemoBanner() {
  const { demoMode, setDemoMode } = useDemoMode()
  if (!demoMode) return null
  return (
    <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-monad/30 bg-monad/10 px-4 py-3">
      <FlaskConical aria-hidden className="h-4 w-4 shrink-0 text-monad-bright" />
      <p className="flex-1 text-[0.75rem] leading-relaxed text-chalk-muted">
        <span className="font-semibold text-monad-bright">Demo mode.</span> Sample data, not read from the chain
        {!PACT_REGISTRY_ADDRESS ? ' — the contract isn’t deployed on this instance yet.' : '.'}
      </p>
      <button
        type="button"
        onClick={() => setDemoMode(false)}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-chalk-faint active:bg-white/10"
        aria-label="Exit demo mode"
      >
        <X aria-hidden className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
