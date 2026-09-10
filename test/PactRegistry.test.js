const { expect } = require('chai')
const { ethers } = require('hardhat')

/**
 * These tests exist to pin the one property the whole product depends on: a
 * prediction's words cannot be quietly changed after the fact, and the chain enforces
 * every rule about who may commit, reveal and resolve — none of it lives only in the
 * frontend, which is the difference between a real guarantee and a UI convention.
 */

const OPEN = 0
const SEALED = 1
const UNRESOLVED = 0
const CORRECT = 1
const INCORRECT = 2
const VOID = 3

function commitmentFor(text, criteria, salt) {
  return ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(['string', 'string', 'bytes32'], [text, criteria, salt]),
  )
}

const SALT = ethers.encodeBytes32String('demo-salt')

describe('PactRegistry', () => {
  async function deploy() {
    const [author, resolver, stranger] = await ethers.getSigners()
    const Factory = await ethers.getContractFactory('PactRegistry')
    const registry = await Factory.deploy()
    await registry.waitForDeployment()
    return { registry, author, resolver, stranger }
  }

  async function future(seconds) {
    const block = await ethers.provider.getBlock('latest')
    return (block?.timestamp ?? Math.floor(Date.now() / 1000)) + seconds
  }

  it('records a commitment and derives the same hash a verifier would compute independently', async () => {
    const { registry, author } = await deploy()
    const text = 'ETH closes above $5,000 before 2027-01-01T00:00:00Z'
    const criteria = 'CoinGecko daily close in USD'
    const commitment = commitmentFor(text, criteria, SALT)
    const resolvesAt = await future(3600)

    const tx = await registry.connect(author).commit(commitment, resolvesAt, 70, OPEN, ethers.ZeroAddress, 0)
    const receipt = await tx.wait()
    const event = receipt.logs
      .map((l) => { try { return registry.interface.parseLog(l) } catch { return null } })
      .find((e) => e && e.name === 'Committed')
    expect(event).to.not.be.undefined

    const id = event.args.id
    const stored = await registry.get(id)
    expect(stored.commitment).to.equal(commitment)
    expect(stored.author).to.equal(author.address)

    // The property that matters: nobody has to trust the app's JavaScript to check this.
    const recomputed = await registry.commitmentFor(text, criteria, SALT)
    expect(recomputed).to.equal(commitment)
  })

  it('a self-resolved prediction is flagged as such, on chain, unhidden', async () => {
    const { registry, author } = await deploy()
    const commitment = commitmentFor('x', 'y', SALT)
    const resolvesAt = await future(3600)
    // resolver left as address(0) -> defaults to msg.sender
    const tx = await registry.connect(author).commit(commitment, resolvesAt, 50, OPEN, ethers.ZeroAddress, 0)
    const receipt = await tx.wait()
    const id = receipt.logs
      .map((l) => { try { return registry.interface.parseLog(l) } catch { return null } })
      .find((e) => e && e.name === 'Committed').args.id

    expect(await registry.isSelfResolved(id)).to.equal(true)

    const stored = await registry.get(id)
    expect(stored.resolver).to.equal(author.address)
  })

  it('revealed text that does not hash to the commitment is rejected', async () => {
    const { registry, author } = await deploy()
    const commitment = commitmentFor('original claim', 'criteria', SALT)
    const resolvesAt = await future(3600)
    const tx = await registry.connect(author).commit(commitment, resolvesAt, 60, SEALED, ethers.ZeroAddress, 0)
    const receipt = await tx.wait()
    const id = receipt.logs
      .map((l) => { try { return registry.interface.parseLog(l) } catch { return null } })
      .find((e) => e && e.name === 'Committed').args.id

    // This is the whole security property: rewriting history after the fact is rejected.
    await expect(
      registry.connect(author).reveal(id, 'a rewritten, more flattering claim', 'criteria', SALT, ''),
    ).to.be.revertedWithCustomError(registry, 'CommitmentMismatch')

    // The true original text still verifies.
    await expect(registry.connect(author).reveal(id, 'original claim', 'criteria', SALT, '')).to.not.be.reverted
  })

  it('only the author can reveal, and only once', async () => {
    const { registry, author, stranger } = await deploy()
    const commitment = commitmentFor('a', 'b', SALT)
    const resolvesAt = await future(3600)
    const tx = await registry.connect(author).commit(commitment, resolvesAt, 50, SEALED, ethers.ZeroAddress, 0)
    const receipt = await tx.wait()
    const id = receipt.logs
      .map((l) => { try { return registry.interface.parseLog(l) } catch { return null } })
      .find((e) => e && e.name === 'Committed').args.id

    await expect(registry.connect(stranger).reveal(id, 'a', 'b', SALT, '')).to.be.revertedWithCustomError(
      registry,
      'NotTheAuthor',
    )
    await registry.connect(author).reveal(id, 'a', 'b', SALT, '')
    await expect(registry.connect(author).reveal(id, 'a', 'b', SALT, '')).to.be.revertedWithCustomError(
      registry,
      'AlreadyRevealed',
    )
  })

  it('cannot resolve before the resolution time, before reveal, or twice', async () => {
    const { registry, author, resolver } = await deploy()
    const commitment = commitmentFor('a', 'b', SALT)
    const resolvesAt = await future(3600)
    const tx = await registry.connect(author).commit(commitment, resolvesAt, 50, OPEN, resolver.address, 0)
    const receipt = await tx.wait()
    const id = receipt.logs
      .map((l) => { try { return registry.interface.parseLog(l) } catch { return null } })
      .find((e) => e && e.name === 'Committed').args.id

    // Too early, and unrevealed.
    await expect(registry.connect(resolver).resolve(id, CORRECT)).to.be.revertedWithCustomError(
      registry,
      'TooEarlyToResolve',
    )

    await registry.connect(author).reveal(id, 'a', 'b', SALT, '')

    // Still too early even once revealed.
    await expect(registry.connect(resolver).resolve(id, CORRECT)).to.be.revertedWithCustomError(
      registry,
      'TooEarlyToResolve',
    )

    await ethers.provider.send('evm_increaseTime', [3601])
    await ethers.provider.send('evm_mine', [])

    // Only the named resolver may grade it.
    await expect(registry.connect(author).resolve(id, CORRECT)).to.be.revertedWithCustomError(
      registry,
      'NotTheResolver',
    )

    await registry.connect(resolver).resolve(id, CORRECT)
    const resolved = await registry.get(id)
    expect(resolved.outcome).to.equal(CORRECT)

    await expect(registry.connect(resolver).resolve(id, INCORRECT)).to.be.revertedWithCustomError(
      registry,
      'AlreadyResolved',
    )
  })

  it('an unrevealed prediction cannot be resolved even after its deadline passes', async () => {
    // The exact failure mode this contract exists to prevent: grading a claim nobody
    // has actually read the text of.
    const { registry, author, resolver } = await deploy()
    const commitment = commitmentFor('sealed forever', 'criteria', SALT)
    const resolvesAt = await future(3600)
    const tx = await registry.connect(author).commit(commitment, resolvesAt, 50, SEALED, resolver.address, 0)
    const receipt = await tx.wait()
    const id = receipt.logs
      .map((l) => { try { return registry.interface.parseLog(l) } catch { return null } })
      .find((e) => e && e.name === 'Committed').args.id

    await ethers.provider.send('evm_increaseTime', [3601])
    await ethers.provider.send('evm_mine', [])

    await expect(registry.connect(resolver).resolve(id, VOID)).to.be.revertedWithCustomError(
      registry,
      'MustRevealBeforeResolving',
    )
  })

  it('rejects a resolution date in the past and an out-of-range confidence', async () => {
    const { registry, author } = await deploy()
    const commitment = commitmentFor('a', 'b', SALT)
    const past = (await ethers.provider.getBlock('latest')).timestamp - 10
    await expect(
      registry.connect(author).commit(commitment, past, 50, OPEN, ethers.ZeroAddress, 0),
    ).to.be.revertedWithCustomError(registry, 'ResolutionInPast')

    const resolvesAt = await future(3600)
    await expect(
      registry.connect(author).commit(commitment, resolvesAt, 0, OPEN, ethers.ZeroAddress, 0),
    ).to.be.revertedWithCustomError(registry, 'ConfidenceOutOfRange')
    await expect(
      registry.connect(author).commit(commitment, resolvesAt, 101, OPEN, ethers.ZeroAddress, 0),
    ).to.be.revertedWithCustomError(registry, 'ConfidenceOutOfRange')
  })

  it('category rides with commit and is public even when sealed; reasoning rides with reveal and is never hashed', async () => {
    const { registry, author } = await deploy()
    const text = 'ETH closes above $5,000'
    const criteria = 'CoinGecko daily close'
    const commitment = commitmentFor(text, criteria, SALT)
    const resolvesAt = await future(3600)

    const CRYPTO = 0
    const tx = await registry.connect(author).commit(commitment, resolvesAt, 80, SEALED, ethers.ZeroAddress, CRYPTO)
    const receipt = await tx.wait()
    const committed = receipt.logs
      .map((l) => { try { return registry.interface.parseLog(l) } catch { return null } })
      .find((e) => e && e.name === 'Committed')
    // Category is readable immediately, from the commit itself — before any reveal.
    expect(committed.args.category).to.equal(CRYPTO)

    // Reasoning is not part of what reveal() verifies: two different reasonings behind
    // the exact same text/criteria/salt both verify, because only the claim itself — not
    // the argument for it — is what the timestamp is protecting.
    const revealTx = await registry.connect(author).reveal(committed.args.id, text, criteria, SALT, 'Because the halving cycle historically precedes a rally.')
    const revealReceipt = await revealTx.wait()
    const revealed = revealReceipt.logs
      .map((l) => { try { return registry.interface.parseLog(l) } catch { return null } })
      .find((e) => e && e.name === 'Revealed')
    expect(revealed.args.reasoning).to.equal('Because the halving cycle historically precedes a rally.')
    expect(revealed.args.text).to.equal(text)
  })
})
