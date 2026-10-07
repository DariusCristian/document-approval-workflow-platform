import { fetchJson } from './client'

export interface Document {
  id: number
  title: string
  content: string
  status: string
  createdById: number
  createdAt: string
}

export interface DocumentComment {
  id: number
  documentId: number
  authorId: number
  content: string
  createdAt: string
}

export interface ApprovalDecision {
  id: number
  documentId: number
  decidedById: number
  decision: string
  comment: string | null
  decidedAt: string
}

export type DecisionType = 'APPROVE' | 'REJECT'

interface CreateDocumentRequest {
  title: string
  content: string
  createdById: number
}

export function getDocuments(): Promise<Document[]> {
  return fetchJson<Document[]>('/api/documents')
}

export function getDocumentById(id: number): Promise<Document> {
  return fetchJson<Document>(`/api/documents/${id}`)
}

export function getDocumentComments(id: number): Promise<DocumentComment[]> {
  return fetchJson<DocumentComment[]>(`/api/documents/${id}/comments`)
}

interface CreateDocumentCommentRequest {
  // TEMPORARY: the client sends its own user ID until real authentication
  // lets the backend work out the current user itself.
  authorId: number
  content: string
}

export function createDocumentComment(
  id: number,
  authorId: number,
  content: string,
): Promise<DocumentComment> {
  const payload: CreateDocumentCommentRequest = { authorId, content }

  return fetchJson<DocumentComment>(`/api/documents/${id}/comments`, {
    method: 'POST',
    body: payload,
  })
}

export function getDocumentDecisions(id: number): Promise<ApprovalDecision[]> {
  return fetchJson<ApprovalDecision[]>(`/api/documents/${id}/decisions`)
}

interface CreateDocumentDecisionRequest {
  // TEMPORARY: the client sends its own user ID until real authentication
  // lets the backend work out the current user itself.
  decidedById: number
  decision: DecisionType
  comment?: string
}

export function createDocumentDecision(
  id: number,
  decidedById: number,
  decision: DecisionType,
  comment?: string,
): Promise<ApprovalDecision> {
  const payload: CreateDocumentDecisionRequest = {
    decidedById,
    decision,
  }

  if (comment) {
    payload.comment = comment
  }

  return fetchJson<ApprovalDecision>(`/api/documents/${id}/decisions`, {
    method: 'POST',
    body: payload,
  })
}

interface UpdateDocumentStatusRequest {
  status: string
}

export function updateDocumentStatus(id: number, status: string): Promise<Document> {
  const payload: UpdateDocumentStatusRequest = { status }

  return fetchJson<Document>(`/api/documents/${id}/status`, {
    method: 'PATCH',
    body: payload,
  })
}

export function createDocument(
  title: string,
  content: string,
  createdById: number,
): Promise<Document> {
  const payload: CreateDocumentRequest = { title, content, createdById }

  return fetchJson<Document>('/api/documents', {
    method: 'POST',
    body: payload,
  })
}
