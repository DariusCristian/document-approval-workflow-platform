import { cn } from '../../utils/cn'

interface LogoProps {
  className?: string
}

// The app's mark (a document with a check) and name.
function Logo({ className }: LogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span className="flex size-8 items-center justify-center rounded-lg bg-accent text-on-accent">
        <svg
          className="size-4.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
          <path d="M14 3v5h5" />
          <path d="m9 14 2 2 4-4" />
        </svg>
      </span>
      <span className="text-base font-semibold tracking-tight text-ink">DocFlow</span>
    </span>
  )
}

export default Logo
