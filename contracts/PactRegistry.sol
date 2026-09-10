// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * PACT MARKETS — Proof of Prediction
 *
 * The problem this contract exists to solve is small and specific: after something
 * happens, anyone can say "I called it". There is normally no way to check whether the
 * call existed beforehand, said what they now claim it said, or was quietly edited.
 *
 * So this stores one thing per prediction that cannot be argued with — a commitment
 * hash, and the block timestamp it was made at. Everything else about a prediction (its
 * text, tags, reasoning) lives off chain, because putting prose on chain costs gas
 * without making it any more true.
 *
 * ## Two modes, and why both exist
 *
 * OPEN     The text is published immediately, off chain, alongside its hash. Anyone can
 *          recompute keccak256(text, salt) and check it matches what was committed. The
 *          value here is purely the timestamp: proof of *when*.
 *
 * SEALED   Only the hash is published. The text stays private until the author reveals
 *          it. This proves you made a call without telling everyone what it was — which
 *          is what an analyst who does not want to move the thing they are predicting
 *          actually needs. Proof of *when* and *what*, without broadcasting either.
 *
 * A sealed prediction that is never revealed proves nothing about content, and this
 * contract does not pretend otherwise: `reveal` is the only thing that binds a hash to
 * a claim, and it verifies the hash rather than trusting the caller.
 *
 * ## What this contract deliberately does not do
 *
 * It does not compute reputation. A score is a product decision that will change, and
 * baking one into immutable storage would either freeze it or invite an upgrade proxy
 * nobody should have to trust. Every input to a score is emitted as an event, so anyone
 * can recompute it independently and check the number the app shows them.
 *
 * It does not hold funds, take fees, or let anyone bet. This is a record, not a market
 * maker, and there is no path in this code that moves value.
 */
contract PactRegistry {
    // --- types ------------------------------------------------------------------------

    enum Visibility {
        Open, // text published immediately
        Sealed // text withheld until revealed
    }

    enum Outcome {
        Unresolved,
        Correct,
        Incorrect,
        /// The resolution criteria did not actually decide the question.
        Void
    }

    struct Prediction {
        address author;
        /// keccak256(abi.encode(text, criteria, salt)). The only claim this chain makes.
        bytes32 commitment;
        uint64 createdAt;
        uint64 resolvesAt;
        /// 1-100. Stated up front so calibration can be measured, not asserted later.
        uint8 confidence;
        Visibility visibility;
        Outcome outcome;
        /// True once the author has revealed text matching `commitment`.
        bool revealed;
        /// Who is allowed to resolve this one. See the resolver notes below.
        address resolver;
    }

    // --- storage ----------------------------------------------------------------------

    uint256 public nextId = 1;
    mapping(uint256 => Prediction) private predictions;

    /// Per author, cheap to read on chain and used by the app for quick profile loads.
    mapping(address => uint256) public predictionCount;

    // --- events -----------------------------------------------------------------------
    //
    // The event log is the real interface. The app indexes these, and anyone who distrusts
    // the app can rebuild every score and leaderboard from them without asking us.

    event Committed(
        uint256 indexed id,
        address indexed author,
        bytes32 commitment,
        uint64 createdAt,
        uint64 resolvesAt,
        uint8 confidence,
        Visibility visibility,
        address resolver,
        uint8 category
    );

    /**
     * `reasoning` travels with the reveal, not the commit — deliberately. `category` is
     * a coarse, low-information tag ("this is about crypto") that helps discovery without
     * giving away the actual claim, so it is safe to publish immediately even for a
     * SEALED prediction. `reasoning` is not: an analyst's argument for *why* they think
     * ETH hits $5,000 can leak the prediction itself well before the words "ETH" and
     * "$5,000" ever appear, which would defeat sealing entirely. So it stays with the
     * one event that only fires once the author has chosen to reveal.
     */
    event Revealed(uint256 indexed id, address indexed author, string text, string criteria, string reasoning);

    event Resolved(uint256 indexed id, address indexed resolver, Outcome outcome, uint64 resolvedAt);

    // --- errors -----------------------------------------------------------------------

    error UnknownPrediction();
    error ResolutionInPast();
    error ConfidenceOutOfRange();
    error NotTheAuthor();
    error AlreadyRevealed();
    error CommitmentMismatch();
    error NotTheResolver();
    error AlreadyResolved();
    error TooEarlyToResolve();
    error MustRevealBeforeResolving();

    // --- writes -----------------------------------------------------------------------

    /**
     * Record a prediction.
     *
     * `commitment` is computed off chain as `keccak256(abi.encode(text, criteria, salt))`.
     * The salt matters for sealed predictions: without it, a short prediction drawn from a
     * small set of likely phrasings ("ETH hits 5000 in December") could be brute forced
     * out of its own hash, which would defeat the point of sealing it.
     *
     * `resolver` is stated at commit time rather than chosen afterwards, so nobody can
     * wait to see how a prediction turned out and then appoint someone friendly to judge
     * it. Setting it to the author's own address is allowed and is *not* hidden — the app
     * marks those predictions as self-resolved, because a self-graded record is worth
     * exactly as much as its author's reputation and no more.
     */
    function commit(
        bytes32 commitment,
        uint64 resolvesAt,
        uint8 confidence,
        Visibility visibility,
        address resolver,
        uint8 category
    ) external returns (uint256 id) {
        if (resolvesAt <= block.timestamp) revert ResolutionInPast();
        if (confidence == 0 || confidence > 100) revert ConfidenceOutOfRange();

        id = nextId++;
        predictions[id] = Prediction({
            author: msg.sender,
            commitment: commitment,
            createdAt: uint64(block.timestamp),
            resolvesAt: resolvesAt,
            confidence: confidence,
            visibility: visibility,
            outcome: Outcome.Unresolved,
            revealed: false,
            resolver: resolver == address(0) ? msg.sender : resolver
        });

        unchecked {
            predictionCount[msg.sender]++;
        }

        emit Committed(
            id,
            msg.sender,
            commitment,
            uint64(block.timestamp),
            resolvesAt,
            confidence,
            visibility,
            predictions[id].resolver,
            category
        );
    }

    /**
     * Bind the committed hash to actual words.
     *
     * The check here is the entire security property of the product: text that does not
     * hash to the original commitment is rejected, so a prediction cannot be quietly
     * rewritten after the fact to match what happened. An OPEN prediction is normally
     * revealed in the same breath as it is committed; a SEALED one is revealed whenever
     * its author chooses, including after resolution.
     */
    function reveal(
        uint256 id,
        string calldata text,
        string calldata criteria,
        bytes32 salt,
        string calldata reasoning
    ) external {
        Prediction storage p = predictions[id];
        if (p.author == address(0)) revert UnknownPrediction();
        if (msg.sender != p.author) revert NotTheAuthor();
        if (p.revealed) revert AlreadyRevealed();
        // `reasoning` is deliberately NOT part of the hashed commitment — it was never a
        // claim the timestamp needs to protect, only color explaining the claim that is.
        if (keccak256(abi.encode(text, criteria, salt)) != p.commitment) revert CommitmentMismatch();

        p.revealed = true;
        emit Revealed(id, p.author, text, criteria, reasoning);
    }

    /**
     * Record how it turned out.
     *
     * Only after `resolvesAt`, so nobody can call a prediction correct while it could
     * still go the other way. Only once. And only after the text is known — resolving a
     * hash means grading a claim nobody has read, which would be theatre.
     */
    function resolve(uint256 id, Outcome outcome) external {
        Prediction storage p = predictions[id];
        if (p.author == address(0)) revert UnknownPrediction();
        if (msg.sender != p.resolver) revert NotTheResolver();
        if (p.outcome != Outcome.Unresolved) revert AlreadyResolved();
        if (outcome == Outcome.Unresolved) revert AlreadyResolved();
        if (block.timestamp < p.resolvesAt) revert TooEarlyToResolve();
        if (!p.revealed) revert MustRevealBeforeResolving();

        p.outcome = outcome;
        emit Resolved(id, msg.sender, outcome, uint64(block.timestamp));
    }

    // --- reads ------------------------------------------------------------------------

    function get(uint256 id) external view returns (Prediction memory) {
        Prediction memory p = predictions[id];
        if (p.author == address(0)) revert UnknownPrediction();
        return p;
    }

    /**
     * Recompute a commitment, so a verifier never has to trust the app's arithmetic.
     *
     * A `pure` helper rather than something the UI does privately in JavaScript: anyone
     * can call this against the deployed contract with text they were shown and see for
     * themselves whether it produces the hash that was committed.
     */
    function commitmentFor(
        string calldata text,
        string calldata criteria,
        bytes32 salt
    ) external pure returns (bytes32) {
        return keccak256(abi.encode(text, criteria, salt));
    }

    /** True when this prediction was graded by the person who made it. */
    function isSelfResolved(uint256 id) external view returns (bool) {
        Prediction memory p = predictions[id];
        if (p.author == address(0)) revert UnknownPrediction();
        return p.resolver == p.author;
    }
}
