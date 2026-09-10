import type { Config } from 'tailwindcss'

/**
 * PACT MARKETS design tokens.
 *
 * Deliberately not a purple reskin of PACT's gold. That product lives inside Nimiq Pay
 * and borrows its warmth on purpose; this one is a standalone terminal for people
 * deciding whether to trust a claim, and it needs to read as precise rather than warm —
 * closer to a trading terminal than a wallet screen.
 *
 * `signal.*` is the one addition PACT's palette never needed: an outcome vocabulary.
 * Every prediction eventually resolves to correct, incorrect, pending or disputed, and
 * that state has to be readable at a glance across cards, badges and the profile chart —
 * so it gets its own named scale rather than borrowing "success green" from a generic
 * design system and hoping it reads as "resolved true" specifically.
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Canvas / surfaces — a hair cooler than pure black, closer to a terminal than a
        // wallet: OLED-safe, but reads as "instrument panel" rather than "app at rest".
        ink: {
          950: '#05060A',
          900: '#0A0C12',
          850: '#0F1219',
          800: '#151923',
          700: '#1D222E',
          600: '#2A303F',
        },
        chalk: {
          DEFAULT: '#F3F4F7',
          muted: '#9AA1B2',
          faint: '#5C6478',
        },
        // Monad's own brand purple (#836EF9), used as the one accent that ties every
        // screen back to the chain the whole product's trust claim depends on.
        monad: {
          DEFAULT: '#836EF9',
          bright: '#A196FC',
          deep: '#5C4ADB',
        },
        // Outcome states. Never reused for anything else, so "green" always specifically
        // means "resolved correct" and nothing gets ambiguous at a glance.
        signal: {
          correct: '#33D17A',
          incorrect: '#F0524B',
          pending: '#E8A93A',
          disputed: '#F0524B',
          void: '#6B7284',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        'display-lg': ['2.5rem', { lineHeight: '1.05', letterSpacing: '-0.035em', fontWeight: '680' }],
        display: ['1.875rem', { lineHeight: '1.1', letterSpacing: '-0.03em', fontWeight: '660' }],
        title: ['1.375rem', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '640' }],
        heading: ['1.0625rem', { lineHeight: '1.3', letterSpacing: '-0.012em', fontWeight: '620' }],
        body: ['0.9375rem', { lineHeight: '1.55', letterSpacing: '-0.005em' }],
        small: ['0.8125rem', { lineHeight: '1.5' }],
        micro: ['0.6875rem', { lineHeight: '1.35', letterSpacing: '0.06em' }],
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.125rem',
      },
      boxShadow: {
        'glow-monad': '0 0 24px -6px rgba(131, 110, 249, 0.55)',
        'glow-correct': '0 0 20px -6px rgba(51, 209, 122, 0.5)',
        'glow-incorrect': '0 0 20px -6px rgba(240, 82, 75, 0.5)',
      },
      spacing: {
        tap: '2.75rem',
      },
    },
  },
  plugins: [],
}

export default config
