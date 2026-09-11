// Loads `.env.local` first (this project's convention everywhere else — see
// .env.example and scripts/deploy.cjs, which writes the deployed address there), falling
// back to a plain `.env` for anyone who prefers that name. Plain `require('dotenv/config')`
// only ever reads `.env`, which would silently leave DEPLOYER_PRIVATE_KEY unset here even
// with a correctly filled-in `.env.local` sitting right next to it.
require('dotenv').config({ path: '.env.local' })
require('dotenv').config({ path: '.env' })

/**
 * Plain CommonJS rather than hardhat.config.ts.
 *
 * Hardhat 2.x loads a `.ts` config through ts-node, and ts-node's config reader crashes
 * under Node 25 (`Cannot read properties of undefined (reading 'fileExists')` inside
 * ts-node/src/configuration.ts) — a known incompatibility, and Hardhat's own CLI prints
 * "Node.js v25.2.1 is not supported" on every run. Node 25 has native TypeScript
 * execution (used everywhere else in this project's own scripts and tests), but
 * Hardhat's config loader specifically still goes through ts-node regardless, so that
 * doesn't help here. Plain JS sidesteps the broken path entirely rather than pinning an
 * older Node just to appease one tool's config loader.
 *
 * Monad Testnet: chain ID 10143, confirmed against docs.monad.xyz and
 * https://chainlist.org/chain/10143 — fully EVM-equivalent, so nothing about this network
 * block is Monad-specific beyond the RPC URL and chain ID.
 */
const MONAD_TESTNET_RPC = process.env.MONAD_TESTNET_RPC || 'https://testnet-rpc.monad.xyz'
// MetaMask's own "Show private key" export omits the 0x prefix Hardhat requires here —
// normalized rather than left as a footgun someone hits once per fresh deployer key.
const rawKey = process.env.DEPLOYER_PRIVATE_KEY
const DEPLOYER_KEY = rawKey ? (rawKey.startsWith('0x') ? rawKey : `0x${rawKey}`) : undefined

require('@nomicfoundation/hardhat-toolbox')

/** @type {import('hardhat/config').HardhatUserConfig} */
module.exports = {
  solidity: {
    version: '0.8.24',
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    monadTestnet: {
      url: MONAD_TESTNET_RPC,
      chainId: 10143,
      accounts: DEPLOYER_KEY ? [DEPLOYER_KEY] : [],
    },
  },
  // Monadscan is Etherscan-powered and speaks Etherscan's unified v2 API (one API key,
  // chain selected via `chainid`) — confirmed against docs.monad.xyz/tooling-and-infra/
  // block-explorers and docs.etherscan.io/etherscan-v2. `npx hardhat verify` isn't in
  // Hardhat's built-in chain list for 10143, so it needs to be told explicitly where to
  // send the request. ETHERSCAN_API_KEY is free from etherscan.io — get one there, not
  // from monadscan.com, since it's the same account across every Etherscan-family chain.
  etherscan: {
    apiKey: { monadTestnet: process.env.ETHERSCAN_API_KEY || '' },
    customChains: [
      {
        network: 'monadTestnet',
        chainId: 10143,
        urls: {
          apiURL: 'https://api-testnet.monadscan.com/api',
          browserURL: 'https://testnet.monadscan.com',
        },
      },
    ],
  },
}
