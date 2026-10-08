// Joins class names and skips empty ones: cn('a', isActive && 'b') -> 'a b' or 'a'.
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}
