// The document statuses in workflow order, with the labels shown in the UI.
export const DOCUMENT_STATUSES = ['DRAFT', 'IN_REVIEW', 'APPROVED', 'REJECTED'] as const

export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number]

const statusLabels: Record<DocumentStatus, string> = {
  DRAFT: 'Draft',
  IN_REVIEW: 'In review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
}

export function isDocumentStatus(value: string | null): value is DocumentStatus {
  return DOCUMENT_STATUSES.some((status) => status === value)
}

// "IN_REVIEW" -> "In review". An unknown status is shown as it is.
export function getStatusLabel(status: string): string {
  return isDocumentStatus(status) ? statusLabels[status] : status
}
