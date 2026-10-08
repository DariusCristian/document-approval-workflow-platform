import { cn } from '../../utils/cn'

// Kept apart from Button.tsx, so links (e.g. "New document") can look like buttons too.

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'
export type ButtonSize = 'sm' | 'md'

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-on-accent shadow-sm hover:bg-accent-hover',
  secondary: 'border border-line bg-surface text-ink shadow-sm hover:bg-canvas',
  danger: 'bg-danger text-on-accent shadow-sm hover:bg-danger-hover',
  ghost: 'text-ink-muted hover:bg-surface-muted hover:text-ink',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 gap-1.5 px-3 text-sm',
  md: 'h-10 gap-2 px-4 text-sm',
}

export function buttonClasses(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  className?: string,
): string {
  return cn(
    'inline-flex cursor-pointer items-center justify-center rounded-lg font-medium whitespace-nowrap transition-colors',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
    'disabled:cursor-not-allowed disabled:opacity-60',
    variantClasses[variant],
    sizeClasses[size],
    className,
  )
}
