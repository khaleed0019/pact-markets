require('dotenv/config')

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
const DEPLOYER_KEY = process.env.DEPLOYER_PRIVATE_KEY

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
}
