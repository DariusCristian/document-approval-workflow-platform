import { cn } from '../../utils/cn'

// Shared looks for form fields, so every form in the app matches.

export const labelClasses = 'block text-sm font-medium text-ink'

export function inputClasses(className?: string): string {
  return cn(
    'mt-1.5 block w-full rounded-lg border border-line bg-surface px-3 py-2 text-ink shadow-xs',
    'placeholder:text-ink-subtle',
    'focus:border-accent focus:outline-2 focus:-outline-offset-1 focus:outline-accent',
    'disabled:cursor-not-allowed disabled:bg-canvas disabled:text-ink-subtle',
    className,
  )
}
