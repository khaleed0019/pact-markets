import { defineChain } from 'viem'

/**
 * Monad Testnet, as a viem chain definition.
 *
 * Chain ID 10143 and the RPC endpoint are confirmed against Monad's own documentation
 * and https://chainlist.org/chain/10143, not assumed. The block explorer is Monadscan
 * (Etherscan-powered) — one of two officially listed at
 * docs.monad.xyz/tooling-and-infra/block-explorers, chosen for its familiar verified-
 * source view.
 */
export const monadTestnet = defineChain({
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz'] },
  },
  blockExplorers: {
    default: {
      name: 'Monadscan',
      url: process.env.NEXT_PUBLIC_MONAD_EXPLORER_URL || 'https://testnet.monadscan.com',
    },
  },
  testnet: true,
})

/** Set once, after a real `npm run deploy:monad` — never a placeholder address. */
export const PACT_REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_PACT_REGISTRY_ADDRESS as `0x${string}` | undefined

export function explorerTxUrl(hash: string): string {
  return `${monadTestnet.blockExplorers.default.url}/tx/${hash}`
}

export function explorerAddressUrl(address: string): string {
  return `${monadTestnet.blockExplorers.default.url}/address/${address}`
}
