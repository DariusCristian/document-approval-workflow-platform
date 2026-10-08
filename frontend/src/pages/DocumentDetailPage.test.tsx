import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api/client'
import * as documentsApi from '../api/documents'
import type { Document } from '../api/documents'
import { AuthContext } from '../app/useAuth'
import type { AuthContextValue, CurrentUser } from '../app/useAuth'
import DocumentDetailPage from './DocumentDetailPage'

// No real HTTP calls: every API function is replaced by a mock that each test can configure.
vi.mock('../api/documents')
const api = vi.mocked(documentsApi)

const author: CurrentUser = { id: 1, email: 'author@test.local', fullName: 'Adam Author', role: 'AUTHOR' }
const reviewer: CurrentUser = { id: 2, email: 'reviewer@test.local', fullName: 'Rita Reviewer', role: 'REVIEWER' }
const admin: CurrentUser = { id: 3, email: 'admin@test.local', fullName: 'Alice Admin', role: 'ADMIN' }

function documentBy(creator: CurrentUser, status: string): Document {
  return {
    id: 42,
    title: 'Travel policy',
    content: 'Book trains, not planes.',
    status,
    createdById: creator.id,
    createdByName: creator.fullName,
    createdAt: '2026-10-08T14:32:10.123456',
  }
}

// Renders the page at /documents/42, logged in as `currentUser`, and waits until the document is shown.
async function renderPage(currentUser: CurrentUser, document: Document) {
  api.getDocumentById.mockResolvedValue(document)

  const auth: AuthContextValue = {
    currentUser,
    isCheckingSession: false,
    loginNotice: '',
    refreshCurrentUser: vi.fn(),
    logout: vi.fn(),
  }

  render(
    <AuthContext.Provider value={auth}>
      <MemoryRouter initialEntries={['/documents/42']}>
        <Routes>
          <Route path="/documents/:id" element={<DocumentDetailPage />} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  )

  await screen.findByRole('heading', { name: 'Travel policy' })
}

const submitButton = () => screen.queryByRole('button', { name: 'Submit for review' })
const approveButton = () => screen.queryByRole('button', { name: 'Approve' })
const rejectButton = () => screen.queryByRole('button', { name: 'Reject' })

describe('DocumentDetailPage actions', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    api.getDocumentComments.mockResolvedValue([])
    api.getDocumentDecisions.mockResolvedValue([])
  })

  it('shows "Submit for review" to the author of a draft, and no approve or reject', async () => {
    await renderPage(author, documentBy(author, 'DRAFT'))

    expect(submitButton()).toBeInTheDocument()
    expect(approveButton()).not.toBeInTheDocument()
    expect(rejectButton()).not.toBeInTheDocument()
  })

  it('submits the draft for review when the author clicks the button', async () => {
    api.updateDocumentStatus.mockResolvedValue(documentBy(author, 'IN_REVIEW'))
    await renderPage(author, documentBy(author, 'DRAFT'))

    fireEvent.click(submitButton()!)

    expect(api.updateDocumentStatus).toHaveBeenCalledWith(42, 'IN_REVIEW')
    expect(await screen.findByText('Waiting for a reviewer. Their decision will show up here.')).toBeInTheDocument()
    expect(submitButton()).not.toBeInTheDocument()
  })

  it("shows approve and reject to a reviewer on someone else's document in review", async () => {
    await renderPage(reviewer, documentBy(author, 'IN_REVIEW'))

    expect(approveButton()).toBeInTheDocument()
    expect(rejectButton()).toBeInTheDocument()
    expect(submitButton()).not.toBeInTheDocument()
  })

  it('sends the decision when the reviewer clicks approve', async () => {
    api.createDocumentDecision.mockResolvedValue({
      id: 7,
      documentId: 42,
      decidedById: reviewer.id,
      decidedByName: reviewer.fullName,
      decision: 'APPROVE',
      comment: null,
      decidedAt: '2026-10-08T15:00:00',
    })
    await renderPage(reviewer, documentBy(author, 'IN_REVIEW'))

    fireEvent.click(approveButton()!)

    expect(api.createDocumentDecision).toHaveBeenCalledWith(42, 'APPROVE', undefined)
  })

  it('shows the conflict message and reloads the document when someone else decided first', async () => {
    const conflictMessage = 'This document was just updated by someone else. Please reload and try again.'
    api.createDocumentDecision.mockRejectedValue(new ApiError(409, conflictMessage))
    await renderPage(reviewer, documentBy(author, 'IN_REVIEW'))
    // When the page reloads, the document was already approved by an admin.
    api.getDocumentById.mockResolvedValue(documentBy(author, 'APPROVED'))
    api.getDocumentDecisions.mockResolvedValue([
      {
        id: 8,
        documentId: 42,
        decidedById: admin.id,
        decidedByName: admin.fullName,
        decision: 'APPROVE',
        comment: null,
        decidedAt: '2026-10-08T15:00:00',
      },
    ])

    fireEvent.click(rejectButton()!)

    expect(await screen.findByText(conflictMessage)).toBeInTheDocument()
    expect(await screen.findByText('This document was approved. The decision is final.')).toBeInTheDocument()
    expect(screen.getByText(admin.fullName)).toBeInTheDocument()
    expect(approveButton()).not.toBeInTheDocument()
    expect(rejectButton()).not.toBeInTheDocument()
  })

  it('shows no decision buttons to a reviewer on their own document, and explains why', async () => {
    await renderPage(reviewer, documentBy(reviewer, 'IN_REVIEW'))

    expect(approveButton()).not.toBeInTheDocument()
    expect(rejectButton()).not.toBeInTheDocument()
    expect(screen.getByText(/You can't review your own document/)).toBeInTheDocument()
  })

  it("shows approve and reject to an admin on someone else's document in review", async () => {
    await renderPage(admin, documentBy(reviewer, 'IN_REVIEW'))

    expect(approveButton()).toBeInTheDocument()
    expect(rejectButton()).toBeInTheDocument()
  })

  it('shows no decision buttons to an admin on their own document', async () => {
    await renderPage(admin, documentBy(admin, 'IN_REVIEW'))

    expect(approveButton()).not.toBeInTheDocument()
    expect(rejectButton()).not.toBeInTheDocument()
    expect(screen.getByText(/You can't review your own document/)).toBeInTheDocument()
  })

  it("shows no actions to an admin on someone else's draft", async () => {
    await renderPage(admin, documentBy(author, 'DRAFT'))

    expect(submitButton()).not.toBeInTheDocument()
    expect(approveButton()).not.toBeInTheDocument()
    expect(rejectButton()).not.toBeInTheDocument()
  })

  it("shows no decision buttons to an author on someone else's document in review", async () => {
    const otherAuthor: CurrentUser = { ...author, id: 9, fullName: 'Bella Author' }
    await renderPage(otherAuthor, documentBy(author, 'IN_REVIEW'))

    expect(approveButton()).not.toBeInTheDocument()
    expect(rejectButton()).not.toBeInTheDocument()
  })

  it('shows no actions on an approved document, not even to an admin', async () => {
    await renderPage(admin, documentBy(author, 'APPROVED'))

    expect(approveButton()).not.toBeInTheDocument()
    expect(rejectButton()).not.toBeInTheDocument()
    expect(screen.getByText('This document was approved. The decision is final.')).toBeInTheDocument()
  })
})
