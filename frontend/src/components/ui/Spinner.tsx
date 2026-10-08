import { cn } from '../../utils/cn'

interface SpinnerProps {
  // Read out by screen readers; leave empty when the text next to the spinner already says it.
  label?: string
  className?: string
}

// A spinning ring. It takes the text color, so it fits on any button or background.
function Spinner({ label, className }: SpinnerProps) {
  return (
    <span
      role={label ? 'status' : undefined}
      aria-hidden={label ? undefined : true}
      className={cn('inline-block size-4 shrink-0', className)}
    >
      <svg className="size-full animate-spin" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" className="opacity-25" />
        <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
      {label && <span className="sr-only">{label}</span>}
    </span>
  )
}

export default Spinner
