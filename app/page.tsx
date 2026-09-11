import Link from 'next/link'
import { ArrowRight, Lock, Eye, ShieldCheck, Zap, FlaskConical } from 'lucide-react'
import { WalletButton } from '@/components/WalletButton'

/**
 * The landing page has to answer four questions before anyone scrolls: what is this,
 * why does it matter, why blockchain, why Monad specifically. The "why Monad" section is
 * written to a real, checkable claim — sub-second, sub-cent commits — rather than naming
 * the chain as branding, because that is the actual difference Monad's throughput makes
 * to this specific product: a prediction is only proof of timing if locking it in costs
 * nothing and happens fast enough that "I'll commit it later" was never a real excuse.
 *
 * The hero's glow and the header's blur read as "instrument panel with power running
 * through it" rather than a generic dark-mode SaaS page — matching the "trading
 * terminal, not a wallet screen" intent the design tokens were already written around.
 */
export default function Home() {
  return (
    <main className="relative overflow-x-hidden">
      <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-ink-950/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <span className="flex items-center gap-2 text-heading font-bold tracking-tight text-chalk">
            <span className="h-2 w-2 rounded-full bg-monad shadow-glow-monad" aria-hidden />
            PACT MARKETS
          </span>
          <nav className="flex items-center gap-5">
            <Link href="/markets" className="hidden text-small text-chalk-muted transition-colors hover:text-chalk sm:inline">
              Discover
            </Link>
            <Link href="/leaderboard" className="hidden text-small text-chalk-muted transition-colors hover:text-chalk sm:inline">
              Leaderboard
            </Link>
            <WalletButton />
          </nav>
        </div>
      </header>

      {/* --- hero ------------------------------------------------------------------ */}
      <section className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[36rem] bg-[radial-gradient(circle_at_50%_-10%,rgba(131,110,249,0.24),rgba(5,6,10,0)_60%)]"
        />
        <div className="mx-auto max-w-4xl px-6 pb-20 pt-20 text-center sm:pt-28">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-monad/25 bg-monad/[0.08] px-3 py-1 text-micro font-semibold uppercase tracking-[0.18em] text-monad-bright">
            Proof of Prediction
          </p>
          <h1 className="mt-6 text-display-lg text-chalk sm:text-6xl">
            Everyone says
            <br />
            they called it.
            <br />
            <span className="bg-gradient-to-r from-monad-bright to-monad bg-clip-text text-transparent">
              Now prove it.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-body leading-relaxed text-chalk-muted">
            Commit a prediction before it happens. It gets timestamped on Monad and cannot be
            quietly edited afterward. When it resolves, your track record updates — publicly,
            and checkable by anyone.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/create">
              <button className="group relative flex h-[3.25rem] items-center gap-2 overflow-hidden rounded-2xl bg-monad px-7 text-body font-semibold text-white shadow-glow-monad transition-transform active:scale-[0.98] active:bg-monad-deep">
                <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-2xl bg-white/15" aria-hidden />
                <span className="relative">Create a prediction</span>
                <ArrowRight aria-hidden className="relative h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </Link>
            <Link href="/markets">
              <button className="flex h-[3.25rem] items-center gap-2 rounded-2xl border border-white/[0.09] bg-white/[0.03] px-7 text-body font-semibold text-chalk transition-colors hover:bg-white/[0.07] active:bg-white/[0.09]">
                Explore predictions
              </button>
            </Link>
          </div>
          <Link
            href="/markets?demo=1"
            className="mt-5 inline-flex items-center gap-1.5 text-[0.75rem] text-chalk-faint underline decoration-white/20 underline-offset-4 transition-colors hover:text-chalk-muted"
          >
            <FlaskConical aria-hidden className="h-3 w-3" />
            No wallet? Browse with sample data
          </Link>
        </div>
      </section>

      {/* --- how it works ------------------------------------------------------------ */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="text-center text-title text-chalk">How Proof of Prediction works</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <HowStep
            step={1}
            icon={Lock}
            title="Commit"
            body="Publish a hash of your prediction before the event, in one Monad transaction. Sub-second, sub-cent — there's no excuse to commit late."
          />
          <HowStep
            step={2}
            icon={Eye}
            title="Reveal"
            body="Your words go on the record, checked against the hash you committed. Text that doesn't match the original is rejected by the contract, not by trust."
          />
          <HowStep
            step={3}
            icon={ShieldCheck}
            title="Resolve"
            body="Once the outcome is known, the prediction is graded. Every input to your Pact Score is a public event — recomputable by anyone, not asserted by us."
          />
        </div>
      </section>

      {/* --- why monad --------------------------------------------------------------- */}
      <section className="mx-auto max-w-4xl px-6 py-16">
        <div className="surface relative overflow-hidden px-6 py-8 sm:px-10 sm:py-10">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-monad/10 blur-3xl"
          />
          <div className="relative flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-monad/15">
              <Zap aria-hidden className="h-4 w-4 text-monad-bright" />
            </div>
            <h2 className="text-heading text-chalk">Why this needs Monad</h2>
          </div>
          <p className="relative mt-4 text-body leading-relaxed text-chalk-muted">
            A prediction only proves <em className="not-italic text-chalk">when</em> it was made if locking it
            in is fast and cheap enough that there's never a reason to wait. Monad's ~1 second block times and
            near-zero gas on testnet mean committing a call costs nothing and confirms almost immediately — the
            timestamp on chain is trustworthy precisely because there was no friction stopping you from
            recording it the moment you actually thought of it.
          </p>
          <p className="relative mt-3 text-[0.8125rem] leading-relaxed text-chalk-faint">
            Fully EVM-equivalent, so the same Solidity that would run on Ethereum runs here unchanged — this
            isn&rsquo;t a chain-specific trick, it&rsquo;s ordinary commit-reveal made practical by throughput.
          </p>
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-6 py-10 text-center text-[0.7rem] text-chalk-faint">
        Built for the Monad Metropolis hackathon — Trust, Identity &amp; AI Infrastructure track (an onchain
        reputation system) and Social, Attention &amp; Culture (a cultural outcome market). Testnet only —
        nothing here moves real value.
      </footer>
    </main>
  )
}

function HowStep({
  step,
  icon: Icon,
  title,
  body,
}: {
  step: number
  icon: typeof Lock
  title: string
  body: string
}) {
  return (
    <div className="surface group relative px-5 py-6 transition-colors hover:border-monad/25 hover:bg-white/[0.035]">
      <span className="absolute right-5 top-5 text-title font-bold text-white/[0.05]">
        {String(step).padStart(2, '0')}
      </span>
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-monad/15 transition-colors group-hover:bg-monad/25">
        <Icon aria-hidden className="h-4 w-4 text-monad-bright" />
      </div>
      <h3 className="mt-4 text-heading text-chalk">{title}</h3>
      <p className="mt-1.5 text-small leading-relaxed text-chalk-muted">{body}</p>
    </div>
  )
}
