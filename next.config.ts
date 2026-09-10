import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // wagmi's connector barrel (wagmi/connectors) pulls in Coinbase's baseAccount
  // connector, which in turn imports Coinbase's optional x402 payment packages —
  // code paths this app never reaches, since the only connector actually used here
  // is `injected()`. Those x402 packages aren't installed (they're an optional peer
  // of a connector we don't use), so webpack fails to resolve them at build time
  // unless told they're genuinely unused; this aliases them to an empty module
  // rather than pulling in payment-processing dependencies this app has no use for.
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@x402/core/client': false,
      '@x402/evm': false,
      '@x402/evm/exact/client': false,
      '@x402/svm/exact/client': false,
      // Same story: MetaMask's SDK optionally supports React Native (unused, this is a
      // web app), and WalletConnect's logger optionally pretty-prints in Node (unused,
      // logs never reach a terminal in the browser).
      '@react-native-async-storage/async-storage': false,
      'pino-pretty': false,
    }
    return config
  },
}

export default nextConfig
