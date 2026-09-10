import Link from 'next/link'
import { ArrowRight, Lock, Eye, ShieldCheck, Zap } from 'lucide-react'
import { WalletButton } from '@/components/WalletButton'

/**
 * The landing page has to answer four questions before anyone scrolls: what is this,
 * why does it matter, why blockchain, why Monad specifically. The "why Monad" section is
 * written to a real, checkable claim — sub-second, sub-cent commits — rather than naming
 * the chain as branding, because that is the actual difference Monad's throughput makes
 * to this specific product: a prediction is only proof of timing if locking it in costs
 * nothing and happens fast enough that "I'll commit it later" was never a real excuse.
 */
export default function Home() {
  return (
    <main>
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span className="text-heading font-bold tracking-tight text-chalk">PACT MARKETS</span>
        <WalletButton />
      </header>

      {/* --- hero ------------------------------------------------------------------ */}
      <section className="mx-auto max-w-4xl px-6 pb-20 pt-16 text-center">
        <p className="text-micro font-semibold uppercase tracking-[0.2em] text-monad-bright">Proof of Prediction</p>
        <h1 className="mt-5 text-display-lg text-chalk sm:text-6xl">
          Everyone says
          <br />
          they called it.
          <br />
          <span className="text-monad-bright">Now prove it.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-body leading-relaxed text-chalk-muted">
          Commit a prediction before it happens. It gets timestamped on Monad and cannot be
          quietly edited afterward. When it resolves, your track record updates — publicly,
          and checkable by anyone.
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/create">
            <button className="flex h-[3.25rem] items-center gap-2 rounded-2xl bg-monad px-7 text-body font-semibold text-white shadow-glow-monad transition-colors active:bg-monad-deep">
              Create a prediction
              <ArrowRight aria-hidden className="h-4 w-4" />
            </button>
          </Link>
          <Link href="/markets">
            <button className="flex h-[3.25rem] items-center gap-2 rounded-2xl border border-white/[0.09] bg-white/[0.03] px-7 text-body font-semibold text-chalk active:bg-white/[0.07]">
              Explore predictions
            </button>
          </Link>
        </div>
      </section>

      {/* --- how it works ------------------------------------------------------------ */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="text-center text-title text-chalk">How Proof of Prediction works</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <HowStep
            icon={Lock}
            title="Commit"
            body="Publish a hash of your prediction before the event, in one Monad transaction. Sub-second, sub-cent — there's no excuse to commit late."
          />
          <HowStep
            icon={Eye}
            title="Reveal"
            body="Your words go on the record, checked against the hash you committed. Text that doesn't match the original is rejected by the contract, not by trust."
          />
          <HowStep
            icon={ShieldCheck}
            title="Resolve"
            body="Once the outcome is known, the prediction is graded. Every input to your Pact Score is a public event — recomputable by anyone, not asserted by us."
          />
        </div>
      </section>

      {/* --- why monad --------------------------------------------------------------- */}
      <section className="mx-auto max-w-4xl px-6 py-16">
        <div className="surface px-6 py-8 sm:px-10 sm:py-10">
          <div className="flex items-center gap-2.5">
            <Zap aria-hidden className="h-4 w-4 text-monad-bright" />
            <h2 className="text-heading text-chalk">Why this needs Monad</h2>
          </div>
          <p className="mt-4 text-body leading-relaxed text-chalk-muted">
            A prediction only proves <em className="not-italic text-chalk">when</em> it was made if locking it
            in is fast and cheap enough that there's never a reason to wait. Monad's ~1 second block times and
            near-zero gas on testnet mean committing a call costs nothing and confirms almost immediately — the
            timestamp on chain is trustworthy precisely because there was no friction stopping you from
            recording it the moment you actually thought of it.
          </p>
          <p className="mt-3 text-[0.8125rem] leading-relaxed text-chalk-faint">
            Fully EVM-equivalent, so the same Solidity that would run on Ethereum runs here unchanged — this
            isn&rsquo;t a chain-specific trick, it&rsquo;s ordinary commit-reveal made practical by throughput.
          </p>
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-6 py-10 text-center text-[0.7rem] text-chalk-faint">
        Built for the Monad Metropolis hackathon. Testnet only — nothing here moves real value.
      </footer>
    </main>
  )
}

function HowStep({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Lock
  title: string
  body: string
}) {
  return (
    <div className="surface px-5 py-6">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-monad/15">
        <Icon aria-hidden className="h-4 w-4 text-monad-bright" />
      </div>
      <h3 className="mt-4 text-heading text-chalk">{title}</h3>
      <p className="mt-1.5 text-small leading-relaxed text-chalk-muted">{body}</p>
    </div>
  )
}
