import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'md' | 'lg'

const VARIANTS: Record<Variant, string> = {
  primary:
    'relative overflow-hidden bg-monad text-white shadow-glow-monad hover:bg-monad-deep active:scale-[0.98] active:bg-monad-deep',
  secondary:
    'bg-white/[0.06] text-chalk border border-white/[0.09] hover:bg-white/[0.09] active:bg-white/[0.1]',
  ghost: 'bg-transparent text-chalk-muted hover:bg-white/[0.04] active:bg-white/[0.05]',
}

const SIZES: Record<Size, string> = {
  md: 'h-11 px-4 text-small rounded-xl',
  lg: 'h-[3.25rem] px-6 text-body rounded-2xl',
}

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  busy?: boolean
  fullWidth?: boolean
}

export const Button = forwardRef<HTMLButtonElement, Props>(
  ({ variant = 'primary', size = 'md', busy = false, fullWidth = false, className, children, disabled, ...rest }, ref) => (
    <button
      ref={ref}
      disabled={disabled || busy}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-150',
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100',
        VARIANTS[variant],
        SIZES[size],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {/* A faint top-half highlight on the primary button reads as a physical, pressable
          surface rather than a flat color fill — the one glassy touch this design language
          allows itself, reserved for the single most important action on each screen. */}
      {variant === 'primary' && (
        <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-[inherit] bg-white/15" aria-hidden />
      )}
      {busy && <Loader2 aria-hidden className="relative h-4 w-4 animate-spin" />}
      <span className="relative">{children}</span>
    </button>
  ),
)
Button.displayName = 'Button'
