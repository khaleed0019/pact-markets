const { ethers } = require('hardhat')
const { writeFile, readFile } = require('node:fs/promises')

/**
 * Plain CommonJS for the same reason as hardhat.config.cjs: `hardhat run` on a .ts file
 * goes through ts-node, which crashes under Node 25.
 *
 * Deploys PactRegistry and writes its address into .env.local, so the frontend picks it
 * up on the next dev server restart without anyone hand-copying an address out of a
 * terminal — the one manual step that quietly breaks demos five minutes before judging.
 */
async function main() {
  const [deployer] = await ethers.getSigners()
  console.log(`Deploying from ${deployer.address}`)
  const balance = await ethers.provider.getBalance(deployer.address)
  console.log(`Balance: ${ethers.formatEther(balance)} MON`)

  const Factory = await ethers.getContractFactory('PactRegistry')
  const registry = await Factory.deploy()
  await registry.waitForDeployment()
  const address = await registry.getAddress()

  const network = await ethers.provider.getNetwork()
  console.log(`PactRegistry deployed to ${address} on chain ${network.chainId}`)

  const envPath = '.env.local'
  let existing = ''
  try {
    existing = await readFile(envPath, 'utf-8')
  } catch {
    // No .env.local yet — starting fresh.
  }
  const lines = existing.split('\n').filter((line) => !line.startsWith('NEXT_PUBLIC_PACT_REGISTRY_ADDRESS='))
  lines.push(`NEXT_PUBLIC_PACT_REGISTRY_ADDRESS=${address}`)
  await writeFile(envPath, lines.filter(Boolean).join('\n') + '\n')
  console.log(`Wrote NEXT_PUBLIC_PACT_REGISTRY_ADDRESS to ${envPath}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
