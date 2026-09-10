import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'md' | 'lg'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-monad text-white shadow-glow-monad active:bg-monad-deep',
  secondary: 'bg-white/[0.06] text-chalk border border-white/[0.09] active:bg-white/[0.1]',
  ghost: 'bg-transparent text-chalk-muted active:bg-white/[0.05]',
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
        'inline-flex items-center justify-center gap-2 font-semibold transition-colors duration-150',
        'disabled:cursor-not-allowed disabled:opacity-50',
        VARIANTS[variant],
        SIZES[size],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {busy && <Loader2 aria-hidden className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  ),
)
Button.displayName = 'Button'
