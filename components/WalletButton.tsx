'use client'

import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi'
import { Wallet, LogOut, AlertTriangle } from 'lucide-react'
import { monadTestnet } from '@/lib/chain/monad'
import { cn } from '@/lib/cn'

function short(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}

/**
 * Connection has three states the brief explicitly asks not to blur together:
 * disconnected, connected-on-the-wrong-chain, and connected-on-Monad. The middle one
 * exists because "connect wallet" and "connect wallet to the right network" are
 * different facts, and a wallet action later would fail silently against the wrong
 * chain if this let someone through without noticing.
 */
export function WalletButton() {
  const { address, isConnected, chainId } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const { switchChain, isPending: switching } = useSwitchChain()

  if (!isConnected) {
    const injectedConnector = connectors[0]
    return (
      <button
        type="button"
        onClick={() => {
          if (injectedConnector) connect({ connector: injectedConnector })
        }}
        disabled={isPending || !injectedConnector}
        className="flex min-h-tap items-center gap-2 rounded-xl bg-monad px-4 text-small font-semibold text-white transition-colors active:bg-monad-deep disabled:opacity-60"
      >
        <Wallet aria-hidden className="h-4 w-4" />
        {isPending ? 'Connecting…' : injectedConnector ? 'Connect wallet' : 'No wallet found'}
      </button>
    )
  }

  if (chainId !== monadTestnet.id) {
    return (
      <button
        type="button"
        onClick={() => switchChain({ chainId: monadTestnet.id })}
        disabled={switching}
        className="flex min-h-tap items-center gap-2 rounded-xl border border-signal-pending/40 bg-signal-pending/10 px-4 text-small font-semibold text-signal-pending disabled:opacity-60"
      >
        <AlertTriangle aria-hidden className="h-4 w-4" />
        {switching ? 'Switching…' : 'Switch to Monad Testnet'}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={() => disconnect()}
      className={cn(
        'flex min-h-tap items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 text-small text-chalk-muted',
        'active:bg-white/[0.07]',
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-signal-correct" />
      <span className="tabular">{short(address!)}</span>
      <LogOut aria-hidden className="h-3.5 w-3.5" />
    </button>
  )
}
