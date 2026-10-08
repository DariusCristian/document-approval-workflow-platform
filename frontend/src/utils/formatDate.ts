// The backend sends dates without a time zone (e.g. "2026-10-08T14:32:10.123456"),
// so the browser reads them as local time. Shown in en-GB style: "8 Oct 2026, 14:32".

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

const dateTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

function parseDate(value: string): Date | null {
  // Keep at most milliseconds: more than 3 fractional digits isn't standard and some browsers reject it.
  const date = new Date(value.replace(/(\.\d{3})\d+/, '$1'))
  return Number.isNaN(date.getTime()) ? null : date
}

// "8 Oct 2026"
export function formatDate(value: string): string {
  const date = parseDate(value)
  return date ? dateFormatter.format(date) : value
}

// "8 Oct 2026, 14:32"
export function formatDateTime(value: string): string {
  const date = parseDate(value)
  return date ? dateTimeFormatter.format(date) : value
}
