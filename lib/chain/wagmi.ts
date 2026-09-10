import { createConfig, http } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { monadTestnet } from './monad'

/**
 * `injected()` rather than a specific wallet connector: any EVM wallet extension works
 * (MetaMask, Rabby, and every wallet a Monad Metropolis judge is likely already running),
 * and Monad's own docs confirm the testnet needs no wallet beyond standard EVM support —
 * no custom connector was ever a real requirement here.
 */
export const wagmiConfig = createConfig({
  chains: [monadTestnet],
  connectors: [injected()],
  transports: {
    [monadTestnet.id]: http(),
  },
  ssr: true,
})
