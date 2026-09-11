# PACT MARKETS

**Don't trust the call. Verify the timestamp.**

Built for the [Monad Metropolis Hackathon](https://www.monad.xyz/developers/hackathons/metropolis) — submitted under
**Trust, Identity & AI Infrastructure** (an onchain reputation system) and relevant to
**Social, Attention & Culture** (a cultural outcome market).

## The problem

After something happens, anyone can say "I called it." There's normally no way to check whether the call existed
beforehand, said what they now claim it said, or was quietly edited after the fact. PACT MARKETS makes that
checkable: predictions are committed on chain *before* an event, revealed and verified against that commitment, and
graded once the outcome is known. A public, recomputable reputation score — the Pact Score — builds up from that
history.

## What's actually implemented

- **Commit–reveal predictions.** `keccak256(abi.encode(text, criteria, salt))` is committed on chain before an
  event; the real text is revealed later and checked against that hash by the contract, not trusted from the UI.
  Rewriting a prediction after the fact is rejected — that's the entire security property, and it's enforced in
  Solidity, not JavaScript.
- **Open or Sealed.** OPEN predictions publish immediately (proof of *when*); SEALED predictions hide the text until
  the author chooses to reveal — proof of *when* and *what*, without broadcasting either up front. A sealed
  prediction that's never revealed honestly proves nothing about content, and the UI says so rather than hiding
  the gap.
- **Named resolvers, visible self-resolution.** A resolver is chosen at commit time, before the outcome is known, so
  nobody can pick a friendly judge after the fact. Self-resolution is allowed — but it's flagged everywhere, and
  unconditionally excluded from every Pact Score calculation.
- **Pact Score.** A Brier-score-derived calibration multiplier, sqrt-based difficulty scaling (longer-horizon calls
  score more), and sqrt-based volume dampening (average quality × √n, not a raw sum — so nobody out-climbs the board
  by firing off fifty low-effort predictions). Every input is a public chain event; the score is pure arithmetic
  over those events, independently recomputable by anyone, not asserted by the app.
- **No off-chain index to trust.** Discover, Leaderboard and every profile are reconstructed live from
  `Committed` / `Revealed` / `Resolved` event logs via `getContractEvents` — no subgraph, no database. What a judge
  gets by pointing this UI at a fresh deployment is exactly what's really on chain.
- **AI Intelligence Layer**, scoped to never invent a fact: one endpoint judges whether a prediction's *resolution
  criteria* are objectively checkable (never whether the prediction itself is true — that would be the model
  guessing at something the chain doesn't know); another turns a profile's already-computed Pact Score numbers into
  one written sentence, using only the numbers it's given. Both fail quiet and honest ("not configured") if no
  `GEMINI_API_KEY` is set — the app is fully functional without this layer.
- **Live Demo Mode.** A judge can see the whole product — Discover, Leaderboard, a real profile with a real Pact
  Score — without a wallet or testnet MON. Every demo card is labeled DEMO wherever it renders and can't be clicked
  through to a fake `/p/[id]` proof page; commitments shown in demo mode are computed with the same hashing
  function the real create flow uses, so "here's what a commitment looks like" stays accurate even though nothing
  in demo mode was ever submitted to Monad.

## Why this needs Monad specifically

A prediction only proves *when* it was made if locking it in is fast and cheap enough that there's never a reason to
wait. Monad's ~1 second block times and near-zero testnet gas mean committing a call costs nothing and confirms
almost immediately — the timestamp is trustworthy precisely because there was no friction stopping someone from
recording it the moment they actually thought of it. Measured, not guessed (`REPORT_GAS=true npx hardhat test`):

| Call | Gas |
|---|---|
| `commit` | ~143,742 |
| `reveal` | ~37,044 |
| `resolve` | ~33,872 |
| deployment | 884,051 (1.5% of block limit) |

Fully EVM-equivalent, so the exact same Solidity that would run on Ethereum runs here unchanged — this isn't a
chain-specific trick, it's ordinary commit–reveal made practical by throughput.

## Architecture

```
contracts/PactRegistry.sol      commit / reveal / resolve, events as source of truth
lib/chain/                      viem + wagmi: chain config, ABI, useRegistry hooks,
                                 useAllPredictions (the event-log indexer)
lib/predictions/                pure domain logic: types, score.ts (Pact Score),
                                 aggregate.ts (leaderboard/profile), commitment.ts,
                                 demoData.ts (Live Demo Mode)
lib/ai/gemini.ts                the one place either AI route talks to the network
app/                            Next.js 15 App Router — landing, create flow, proof
                                 page, Discover, Leaderboard, profile, AI API routes
test/PactRegistry.test.js       8 Hardhat/Mocha tests against the contract
tests/score.test.ts             10 node:test tests against the Pact Score engine
```

**Honest gaps, not hidden ones:**
- The contract stores no on-chain "list all predictions" — `nextId` is the only counter. That's deliberate (paying
  gas on every commit for a feature only the frontend needs would be wasteful); `useAllPredictions` is the
  off-chain reader that makes up for it.
- A SEALED prediction's text is only visible to non-authors once revealed — `useRevealedContent` reads the
  `Revealed` event log directly, since the contract never stores plaintext in storage at all.
- Salts for SEALED predictions live in the author's own browser (`localStorage`) until reveal. Lose that browser's
  storage before revealing, and that specific prediction is permanently stranded — a named, real limitation, not
  something the UI pretends isn't a risk.

## Running it locally

```bash
npm install
cp .env.example .env.local   # fill in what you have; every value is optional except for deploying
npm run compile              # Solidity
npm run test:contracts       # 8 Hardhat tests
npm test                     # 10 Pact Score unit tests (node:test)
npm run dev                  # Next.js dev server
```

To actually deploy to Monad testnet: set `DEPLOYER_PRIVATE_KEY` (a funded testnet key —
[faucet.monad.xyz](https://faucet.monad.xyz)) and run `npm run deploy:monad`; it writes the deployed address into
`.env.local` automatically. Until that's done, the app runs fully in Live Demo Mode.

## Network

Monad Testnet — chain id `10143`, RPC `https://testnet-rpc.monad.xyz`, explorer
[testnet.monadscan.com](https://testnet.monadscan.com). Testnet only; nothing in this app moves real value.

---

Built during the Monad Metropolis six-week build window (Sept 1 – Oct 13, 2026).
