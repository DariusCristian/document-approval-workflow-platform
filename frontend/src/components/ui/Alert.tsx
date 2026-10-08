import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'

type AlertVariant = 'error' | 'warning' | 'success' | 'info'

const variantClasses: Record<AlertVariant, string> = {
  error: 'border-rejected-dot/30 bg-rejected-bg text-rejected-text',
  warning: 'border-review-dot/30 bg-review-bg text-review-text',
  success: 'border-approved-dot/30 bg-approved-bg text-approved-text',
  info: 'border-line bg-surface-muted text-ink-muted',
}

interface AlertProps {
  variant?: AlertVariant
  title?: string
  // E.g. a "Try again" button.
  action?: ReactNode
  className?: string
  children: ReactNode
}

function Alert({ variant = 'error', title, action, className, children }: AlertProps) {
  return (
    <div
      // Errors are read out right away by screen readers; other messages politely.
      role={variant === 'error' ? 'alert' : 'status'}
      className={cn(
        'flex flex-col gap-3 rounded-lg border px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between',
        variantClasses[variant],
        className,
      )}
    >
      <div>
        {title && <p className="font-semibold">{title}</p>}
        <div>{children}</div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

export default Alert
