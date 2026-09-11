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
  const deployTx = registry.deploymentTransaction()
  await registry.waitForDeployment()
  const address = await registry.getAddress()
  // Discovered the hard way: the public RPC caps eth_getLogs at a 100-block window and
  // doesn't retain full history, so every event read in this app needs a real fromBlock
  // floor rather than 0 — this is that floor, captured at the moment it's cheapest to
  // know (the deploy receipt), instead of binary-searching for it after the fact.
  const deployReceipt = deployTx ? await deployTx.wait() : null
  const deployBlock = deployReceipt?.blockNumber

  const network = await ethers.provider.getNetwork()
  console.log(`PactRegistry deployed to ${address} on chain ${network.chainId}, block ${deployBlock}`)

  const envPath = '.env.local'
  let existing = ''
  try {
    existing = await readFile(envPath, 'utf-8')
  } catch {
    // No .env.local yet — starting fresh.
  }
  const lines = existing
    .split('\n')
    .filter(
      (line) =>
        !line.startsWith('NEXT_PUBLIC_PACT_REGISTRY_ADDRESS=') &&
        !line.startsWith('NEXT_PUBLIC_PACT_REGISTRY_DEPLOY_BLOCK='),
    )
  lines.push(`NEXT_PUBLIC_PACT_REGISTRY_ADDRESS=${address}`)
  if (deployBlock !== undefined) lines.push(`NEXT_PUBLIC_PACT_REGISTRY_DEPLOY_BLOCK=${deployBlock}`)
  await writeFile(envPath, lines.filter(Boolean).join('\n') + '\n')
  console.log(`Wrote NEXT_PUBLIC_PACT_REGISTRY_ADDRESS and NEXT_PUBLIC_PACT_REGISTRY_DEPLOY_BLOCK to ${envPath}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
