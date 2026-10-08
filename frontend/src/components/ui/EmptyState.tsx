import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'

interface EmptyStateProps {
  title: string
  description?: string
  icon?: ReactNode
  // E.g. a "Create your first document" button.
  action?: ReactNode
  className?: string
}

// Shown when a list has nothing in it yet, instead of a blank area.
function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center px-4 py-12 text-center', className)}>
      {icon && (
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-surface-muted text-ink-subtle">
          {icon}
        </div>
      )}
      <p className="font-semibold text-ink">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-ink-subtle">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export default EmptyState
