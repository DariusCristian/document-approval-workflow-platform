// "Rita Reviewer" -> "RR", "Alice" -> "A". Falls back to the first letter of the email.
export function getInitials(fullName: string, email = ''): string {
  const words = fullName.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) {
    return email.charAt(0).toUpperCase()
  }

  const first = words[0].charAt(0)
  const last = words.length > 1 ? words[words.length - 1].charAt(0) : ''
  return (first + last).toUpperCase()
}
