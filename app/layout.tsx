import type { Metadata } from 'next'
import { Providers } from './providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'PACT MARKETS — Proof of Prediction',
  description: "Don't trust the call. Verify the timestamp.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-ink-950 font-sans text-chalk antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
