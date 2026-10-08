import { cn } from '../../utils/cn'

// Full class names written out (not built like `bg-${status}`), because Tailwind only
// generates the classes it can find as complete words in the source code.
const statusStyles: Record<string, { label: string; badge: string; dot: string }> = {
  DRAFT: { label: 'Draft', badge: 'bg-draft-bg text-draft-text', dot: 'bg-draft-dot' },
  IN_REVIEW: { label: 'In review', badge: 'bg-review-bg text-review-text', dot: 'bg-review-dot' },
  APPROVED: { label: 'Approved', badge: 'bg-approved-bg text-approved-text', dot: 'bg-approved-dot' },
  REJECTED: { label: 'Rejected', badge: 'bg-rejected-bg text-rejected-text', dot: 'bg-rejected-dot' },
}

interface StatusBadgeProps {
  status: string
  className?: string
}

function StatusBadge({ status, className }: StatusBadgeProps) {
  // An unknown status still shows up (in gray, with its raw name) instead of breaking the page.
  const style = statusStyles[status] ?? { ...statusStyles.DRAFT, label: status }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
        style.badge,
        className,
      )}
    >
      <span aria-hidden="true" className={cn('size-1.5 rounded-full', style.dot)} />
      {style.label}
    </span>
  )
}

export default StatusBadge
