import { describe, expect, it } from 'vitest'
import { formatDate, formatDateTime } from './formatDate'

describe('formatDate', () => {
  it('shows a backend date as day, short month and year', () => {
    expect(formatDate('2026-10-08T14:32:10')).toBe('8 Oct 2026')
  })

  it('accepts the microseconds the backend sends', () => {
    expect(formatDate('2026-10-08T14:32:10.123456')).toBe('8 Oct 2026')
  })

  it('shows an invalid date as it is instead of "Invalid Date"', () => {
    expect(formatDate('not a date')).toBe('not a date')
  })
})

describe('formatDateTime', () => {
  it('shows a backend date with the time in 24-hour format', () => {
    expect(formatDateTime('2026-10-08T14:32:10.123456')).toBe('8 Oct 2026, 14:32')
  })

  it('pads hours and minutes with a leading zero', () => {
    expect(formatDateTime('2026-01-05T09:05:00')).toBe('5 Jan 2026, 09:05')
  })

  it('shows an invalid date as it is', () => {
    expect(formatDateTime('')).toBe('')
  })
})
