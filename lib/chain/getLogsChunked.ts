import type { Abi, PublicClient } from 'viem'

/**
 * Monad's public testnet RPC caps `eth_getLogs` at a 100-block range per call and, on
 * top of that, doesn't retain full historical state indefinitely (queries against very
 * old blocks return "not found" rather than an empty result) — this was discovered live,
 * against the real deployed contract, not assumed from documentation. A single
 * `fromBlock: 0n, toBlock: 'latest'` call — what every event read in this app started
 * with — fails outright against a chain already past block 60,000,000.
 *
 * This walks the range in windows under that cap and concatenates the results, so every
 * caller keeps the simple "give me every event since deployment" mental model without
 * needing to know about the RPC's pagination limit itself.
 */
const MAX_BLOCK_RANGE = 99n

export async function getContractEventsChunked<
  const TAbi extends Abi,
  TEventName extends string,
>(
  client: PublicClient,
  params: {
    address: `0x${string}`
    abi: TAbi
    eventName: TEventName
    args?: Record<string, unknown>
    fromBlock: bigint
  },
): Promise<Awaited<ReturnType<PublicClient['getContractEvents']>>> {
  const latest = await client.getBlockNumber()
  const results: unknown[] = []

  let start = params.fromBlock
  while (start <= latest) {
    const end = start + MAX_BLOCK_RANGE < latest ? start + MAX_BLOCK_RANGE : latest
    // eslint-disable-next-line no-await-in-loop -- each window depends on nothing but must
    // stay within the RPC's own range cap, so these are inherently sequential
    const logs = await client.getContractEvents({
      address: params.address,
      abi: params.abi,
      eventName: params.eventName,
      args: params.args,
      fromBlock: start,
      toBlock: end,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- viem's ContractEventName<TAbi>
      // needs a concrete ABI literal to narrow against; TAbi here is generic over any caller's ABI,
      // so the precise per-event-name typing is recovered at each call site instead (every caller
      // already knows and asserts the shape of `log.args` for the specific event it asked for).
    } as any)
    results.push(...logs)
    start = end + 1n
  }

  return results as Awaited<ReturnType<PublicClient['getContractEvents']>>
}
