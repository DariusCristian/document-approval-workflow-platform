import { cn } from '../../utils/cn'
import { getInitials } from '../../utils/initials'

interface AvatarProps {
  name: string
  email?: string
  className?: string
}

// A circle with the person's initials. Hidden from screen readers: the name is always shown next to it.
function Avatar({ name, email, className }: AvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent',
        className,
      )}
    >
      {getInitials(name, email)}
    </span>
  )
}

export default Avatar
