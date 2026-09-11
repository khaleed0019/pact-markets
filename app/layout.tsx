import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Providers } from './providers'
import './globals.css'

/**
 * `tailwind.config.ts` has always pointed `font-sans`/`font-mono` at `--font-sans` /
 * `--font-mono` — but nothing ever actually defined those CSS variables. Every page was
 * silently falling back to Tailwind's own generic `system-ui, sans-serif`, which is why
 * the whole app read as plain, characterless system text no matter how the type scale
 * in tailwind.config.ts was tuned. next/font self-hosts both faces (no third-party
 * request at runtime, no layout shift) and actually sets the variables the config has
 * been expecting the whole time.
 *
 * Geist for body text: built for dense, data-heavy screens rather than marketing pages,
 * which is exactly what a proof-of-prediction terminal is. Geist Mono for every tabular
 * value already marked `.tabular` — commitment hashes, addresses, scores, percentages —
 * so numbers actually align instead of rendering in whatever monospace-ish fallback the
 * visitor's OS happens to ship.
 */
const geistSans = Geist({ subsets: ['latin'], variable: '--font-sans', display: 'swap' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' })

export const metadata: Metadata = {
  title: 'PACT MARKETS — Proof of Prediction',
  description: "Don't trust the call. Verify the timestamp.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-ink-950 font-sans text-chalk antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
