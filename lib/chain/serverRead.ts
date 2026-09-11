import { createPublicClient, http } from 'viem'
import { monadTestnet, PACT_REGISTRY_ADDRESS } from './monad.ts'
import { PACT_REGISTRY_ABI } from './abi.ts'
import { OUTCOMES, VISIBILITIES, type Outcome, type Visibility } from '../predictions/types.ts'

/**
 * A plain viem read, usable outside React — the OG image route and any other
 * server-only code that needs one real fact from the chain without dragging in wagmi's
 * hook machinery, which assumes a component tree.
 */
function client() {
  return createPublicClient({ chain: monadTestnet, transport: http() })
}

export interface ServerPredictionSummary {
  author: `0x${string}`
  outcome: Outcome
  visibility: Visibility
  confidence: number
  revealed: boolean
  text: string | null
}

/** Best-effort — returns null on any failure (no deployment, bad id, RPC hiccup) rather
 *  than throwing, since callers (an OG image) must always render *something*. */
export async function readPredictionForCard(id: bigint): Promise<ServerPredictionSummary | null> {
  if (!PACT_REGISTRY_ADDRESS) return null
  try {
    const c = client()
    const p = await c.readContract({
      address: PACT_REGISTRY_ADDRESS,
      abi: PACT_REGISTRY_ABI,
      functionName: 'get',
      args: [id],
    })

    let text: string | null = null
    if (p.revealed) {
      const logs = await c.getContractEvents({
        address: PACT_REGISTRY_ADDRESS,
        abi: PACT_REGISTRY_ABI,
        eventName: 'Revealed',
        args: { id },
        fromBlock: 0n,
        toBlock: 'latest',
      })
      const last = logs.at(-1)
      if (last && 'args' in last) {
        const args = last.args as { text?: string }
        text = args.text ?? null
      }
    }

    return {
      author: p.author,
      outcome: OUTCOMES[p.outcome] ?? 'UNRESOLVED',
      visibility: VISIBILITIES[p.visibility] ?? 'OPEN',
      confidence: p.confidence,
      revealed: p.revealed,
      text,
    }
  } catch {
    return null
  }
}
