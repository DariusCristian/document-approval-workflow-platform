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
  content: string
}

export function createDocumentComment(
  id: number,
  content: string,
): Promise<DocumentComment> {
  const payload: CreateDocumentCommentRequest = { content }

  return fetchJson<DocumentComment>(`/api/documents/${id}/comments`, {
    method: 'POST',
    body: payload,
  })
}

export function getDocumentDecisions(id: number): Promise<ApprovalDecision[]> {
  return fetchJson<ApprovalDecision[]>(`/api/documents/${id}/decisions`)
}

interface CreateDocumentDecisionRequest {
  decision: DecisionType
  comment?: string
}

export function createDocumentDecision(
  id: number,
  decision: DecisionType,
  comment?: string,
): Promise<ApprovalDecision> {
  const payload: CreateDocumentDecisionRequest = {
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
