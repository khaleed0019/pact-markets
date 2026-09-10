import { encodeAbiParameters, keccak256, type Hex } from 'viem'

/**
 * The exact hash the contract expects: `keccak256(abi.encode(text, criteria, salt))`.
 *
 * `encodeAbiParameters` with these three types produces byte-identical output to
 * Solidity's `abi.encode(string, string, bytes32)` — not `encodePacked`, which would
 * silently produce a different hash and make every commitment unverifiable. This is the
 * one place that distinction actually matters, so it is written out in full rather than
 * left to be gotten right by convention.
 */
export function computeCommitment(text: string, criteria: string, salt: Hex): Hex {
  const encoded = encodeAbiParameters(
    [{ type: 'string' }, { type: 'string' }, { type: 'bytes32' }],
    [text, criteria, salt],
  )
  return keccak256(encoded)
}

/** A fresh 32-byte salt. Required for every commitment — see the note in the contract. */
export function randomSalt(): Hex {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return `0x${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}` as Hex
}

/**
 * Where the salt for a SEALED prediction lives until reveal.
 *
 * The salt is the one piece of information that, if lost, permanently strands a sealed
 * prediction — nobody, including its own author, can reveal it without the exact salt
 * used at commit time. Kept in localStorage rather than only in memory so a page reload
 * mid-flow doesn't destroy it; this is a real, named limitation (see the reveal screen's
 * own copy) rather than something the product pretends isn't a risk.
 */
const SALT_STORE_KEY = 'pact-markets:salts'

export function storeSalt(predictionId: string, text: string, criteria: string, salt: Hex, reasoning = ''): void {
  try {
    const store = JSON.parse(localStorage.getItem(SALT_STORE_KEY) ?? '{}') as Record<string, unknown>
    store[predictionId] = { text, criteria, salt, reasoning }
    localStorage.setItem(SALT_STORE_KEY, JSON.stringify(store))
  } catch {
    // Storage can be unavailable (private browsing, quota). The UI's own reveal flow
    // handles a missing salt by asking the user to supply it, rather than assuming it.
  }
}

export function readStoredSalt(
  predictionId: string,
): { text: string; criteria: string; salt: Hex; reasoning: string } | null {
  try {
    const store = JSON.parse(localStorage.getItem(SALT_STORE_KEY) ?? '{}') as Record<
      string,
      { text: string; criteria: string; salt: Hex; reasoning?: string } | undefined
    >
    const entry = store[predictionId]
    return entry ? { ...entry, reasoning: entry.reasoning ?? '' } : null
  } catch {
    return null
  }
}
