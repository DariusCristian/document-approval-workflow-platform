import { describe, expect, it } from 'vitest'
import { getStatusLabel, isDocumentStatus } from './documentStatus'

describe('getStatusLabel', () => {
  it.each([
    ['DRAFT', 'Draft'],
    ['IN_REVIEW', 'In review'],
    ['APPROVED', 'Approved'],
    ['REJECTED', 'Rejected'],
  ])('shows %s as "%s"', (status, label) => {
    expect(getStatusLabel(status)).toBe(label)
  })

  it('shows an unknown status as it is', () => {
    expect(getStatusLabel('ARCHIVED')).toBe('ARCHIVED')
  })
})

describe('isDocumentStatus', () => {
  it('accepts the four known statuses', () => {
    expect(['DRAFT', 'IN_REVIEW', 'APPROVED', 'REJECTED'].every(isDocumentStatus)).toBe(true)
  })

  it('rejects unknown values, lowercase names and null', () => {
    expect(isDocumentStatus('ARCHIVED')).toBe(false)
    expect(isDocumentStatus('draft')).toBe(false)
    expect(isDocumentStatus(null)).toBe(false)
  })
})
