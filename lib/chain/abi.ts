/**
 * PactRegistry ABI, hand-maintained to match contracts/PactRegistry.sol exactly.
 *
 * Hardhat's typechain output (typechain-types/) is the source of truth once the
 * contract is compiled and should be preferred there for full type safety; this const
 * exists so the frontend can be built and reasoned about independently of the Solidity
 * toolchain being installed, and is checked against the real ABI in
 * scripts/deploy.ts's compile step before every deploy.
 */
export const PACT_REGISTRY_ABI = [
  {
    type: 'function',
    name: 'commit',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'commitment', type: 'bytes32' },
      { name: 'resolvesAt', type: 'uint64' },
      { name: 'confidence', type: 'uint8' },
      { name: 'visibility', type: 'uint8' },
      { name: 'resolver', type: 'address' },
      { name: 'category', type: 'uint8' },
    ],
    outputs: [{ name: 'id', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'reveal',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'id', type: 'uint256' },
      { name: 'text', type: 'string' },
      { name: 'criteria', type: 'string' },
      { name: 'salt', type: 'bytes32' },
      { name: 'reasoning', type: 'string' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'resolve',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'id', type: 'uint256' },
      { name: 'outcome', type: 'uint8' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'get',
    stateMutability: 'view',
    inputs: [{ name: 'id', type: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'author', type: 'address' },
          { name: 'commitment', type: 'bytes32' },
          { name: 'createdAt', type: 'uint64' },
          { name: 'resolvesAt', type: 'uint64' },
          { name: 'confidence', type: 'uint8' },
          { name: 'visibility', type: 'uint8' },
          { name: 'outcome', type: 'uint8' },
          { name: 'revealed', type: 'bool' },
          { name: 'resolver', type: 'address' },
        ],
      },
    ],
  },
  {
    type: 'function',
    name: 'commitmentFor',
    stateMutability: 'pure',
    inputs: [
      { name: 'text', type: 'string' },
      { name: 'criteria', type: 'string' },
      { name: 'salt', type: 'bytes32' },
    ],
    outputs: [{ name: '', type: 'bytes32' }],
  },
  {
    type: 'function',
    name: 'isSelfResolved',
    stateMutability: 'view',
    inputs: [{ name: 'id', type: 'uint256' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'nextId',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'predictionCount',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'event',
    name: 'Committed',
    inputs: [
      { name: 'id', type: 'uint256', indexed: true },
      { name: 'author', type: 'address', indexed: true },
      { name: 'commitment', type: 'bytes32', indexed: false },
      { name: 'createdAt', type: 'uint64', indexed: false },
      { name: 'resolvesAt', type: 'uint64', indexed: false },
      { name: 'confidence', type: 'uint8', indexed: false },
      { name: 'visibility', type: 'uint8', indexed: false },
      { name: 'resolver', type: 'address', indexed: false },
      { name: 'category', type: 'uint8', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'Revealed',
    inputs: [
      { name: 'id', type: 'uint256', indexed: true },
      { name: 'author', type: 'address', indexed: true },
      { name: 'text', type: 'string', indexed: false },
      { name: 'criteria', type: 'string', indexed: false },
      { name: 'reasoning', type: 'string', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'Resolved',
    inputs: [
      { name: 'id', type: 'uint256', indexed: true },
      { name: 'resolver', type: 'address', indexed: true },
      { name: 'outcome', type: 'uint8', indexed: false },
      { name: 'resolvedAt', type: 'uint64', indexed: false },
    ],
  },
  { type: 'error', name: 'UnknownPrediction', inputs: [] },
  { type: 'error', name: 'ResolutionInPast', inputs: [] },
  { type: 'error', name: 'ConfidenceOutOfRange', inputs: [] },
  { type: 'error', name: 'NotTheAuthor', inputs: [] },
  { type: 'error', name: 'AlreadyRevealed', inputs: [] },
  { type: 'error', name: 'CommitmentMismatch', inputs: [] },
  { type: 'error', name: 'NotTheResolver', inputs: [] },
  { type: 'error', name: 'AlreadyResolved', inputs: [] },
  { type: 'error', name: 'TooEarlyToResolve', inputs: [] },
  { type: 'error', name: 'MustRevealBeforeResolving', inputs: [] },
] as const
