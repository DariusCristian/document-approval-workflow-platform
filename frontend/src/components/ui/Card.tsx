import type { HTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  // Turn off for content that should touch the edges, like a table.
  padded?: boolean
}

// A white box with a thin border: the main building block of every page.
function Card({ padded = true, className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-line bg-surface shadow-xs',
        padded && 'p-4 sm:p-6',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export default Card
