import { useEffect, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ApiError } from '../api/client'
import {
  createDocumentComment,
  createDocumentDecision,
  getDocumentById,
  getDocumentComments,
  getDocumentDecisions,
  updateDocumentStatus,
} from '../api/documents'
import type {
  ApprovalDecision,
  DecisionType,
  Document,
  DocumentComment,
} from '../api/documents'
import { useAuth } from '../app/useAuth'
import type { CurrentUser } from '../app/useAuth'
import { usePageTitle } from '../app/usePageTitle'
import Alert from '../components/ui/Alert'
import Avatar from '../components/ui/Avatar'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import EmptyState from '../components/ui/EmptyState'
import StatusBadge from '../components/ui/StatusBadge'
import { buttonClasses } from '../components/ui/buttonStyles'
import { inputClasses, labelClasses } from '../components/ui/formStyles'
import { DocumentIcon } from '../components/ui/icons'
import { cn } from '../utils/cn'
import { formatDateTime } from '../utils/formatDate'

function DocumentDetailPage() {
  const { currentUser } = useAuth()
  const { id } = useParams()
  const documentId = Number(id)
  const [document, setDocument] = useState<Document | null>(null)
  const [comments, setComments] = useState<DocumentComment[]>([])
  const [decisions, setDecisions] = useState<ApprovalDecision[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  // True for an invalid id or a 404, so the error card can say "not found".
  const [isNotFound, setIsNotFound] = useState(false)
  const [commentContent, setCommentContent] = useState('')
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [commentErrorMessage, setCommentErrorMessage] = useState('')
  const [decisionComment, setDecisionComment] = useState('')
  // Which decision is being sent, so only that button shows a spinner.
  const [submittingDecision, setSubmittingDecision] = useState<DecisionType | null>(null)
  const [decisionErrorMessage, setDecisionErrorMessage] = useState('')
  const [isSubmittingForReview, setIsSubmittingForReview] = useState(false)
  const [submitForReviewErrorMessage, setSubmitForReviewErrorMessage] = useState('')

  useEffect(() => {
    if (!Number.isInteger(documentId) || documentId <= 0) {
      setErrorMessage('Invalid document id.')
      setIsNotFound(true)
      setIsLoading(false)
      return
    }

    let isCancelled = false

    const loadDocumentDetails = async () => {
      setIsLoading(true)
      setErrorMessage('')
      setIsNotFound(false)

      try {
        const [documentData, commentsData, decisionsData] = await Promise.all([
          getDocumentById(documentId),
          getDocumentComments(documentId),
          getDocumentDecisions(documentId),
        ])

        if (!isCancelled) {
          setDocument(documentData)
          setComments(commentsData)
          setDecisions(decisionsData)
        }
      } catch (error) {
        if (isCancelled) {
          return
        }

        if (error instanceof Error) {
          setErrorMessage(error.message)
        } else {
          setErrorMessage('Failed to load document details.')
        }
        setIsNotFound(error instanceof ApiError && error.status === 404)
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadDocumentDetails()

    return () => {
      isCancelled = true
    }
  }, [documentId])

  const handleCommentSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setCommentErrorMessage('')

    if (!Number.isInteger(documentId) || documentId <= 0) {
      setCommentErrorMessage('Invalid document id.')
      return
    }

    if (!currentUser) {
      setCommentErrorMessage('You must be logged in to add a comment.')
      return
    }

    const trimmedContent = commentContent.trim()
    if (!trimmedContent) {
      setCommentErrorMessage('Comment content is required.')
      return
    }

    setIsSubmittingComment(true)

    try {
      await createDocumentComment(documentId, trimmedContent)
      const refreshedComments = await getDocumentComments(documentId)
      setComments(refreshedComments)
      setCommentContent('')
    } catch (error) {
      if (error instanceof Error) {
        setCommentErrorMessage(error.message)
      } else {
        setCommentErrorMessage('Failed to create comment.')
      }
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const handleDecisionSubmit = async (decision: DecisionType) => {
    setDecisionErrorMessage('')

    if (!Number.isInteger(documentId) || documentId <= 0) {
      setDecisionErrorMessage('Invalid document id.')
      return
    }

    if (!currentUser) {
      setDecisionErrorMessage('You must be logged in to submit a decision.')
      return
    }

    setSubmittingDecision(decision)

    try {
      await createDocumentDecision(
        documentId,
        decision,
        decisionComment.trim() || undefined,
      )

      const [refreshedDocument, refreshedDecisions] = await Promise.all([
        getDocumentById(documentId),
        getDocumentDecisions(documentId),
      ])

      setDocument(refreshedDocument)
      setDecisions(refreshedDecisions)
      setDecisionComment('')
    } catch (error) {
      if (error instanceof Error) {
        setDecisionErrorMessage(error.message)
      } else {
        setDecisionErrorMessage('Failed to submit decision.')
      }

      // 409: someone else decided first. Show the fresh state, so the buttons match the new status.
      if (error instanceof ApiError && error.status === 409) {
        try {
          const [refreshedDocument, refreshedDecisions] = await Promise.all([
            getDocumentById(documentId),
            getDocumentDecisions(documentId),
          ])
          setDocument(refreshedDocument)
          setDecisions(refreshedDecisions)
        } catch {
          // Keep the conflict message; the user can still reload the page.
        }
      }
    } finally {
      setSubmittingDecision(null)
    }
  }

  const handleSubmitForReview = async () => {
    setSubmitForReviewErrorMessage('')
    setIsSubmittingForReview(true)

    try {
      const updatedDocument = await updateDocumentStatus(documentId, 'IN_REVIEW')
      setDocument(updatedDocument)
    } catch (error) {
      if (error instanceof Error) {
        setSubmitForReviewErrorMessage(error.message)
      } else {
        setSubmitForReviewErrorMessage('Failed to submit document for review.')
      }
    } finally {
      setIsSubmittingForReview(false)
    }
  }

  const isAuthor = document !== null && currentUser !== null && document.createdById === currentUser.id
  const canSubmitForReview = isAuthor && document?.status === 'DRAFT'
  // Four-eyes rule: reviewers and admins decide, but never on their own document.
  const canDecide =
    (currentUser?.role === 'REVIEWER' || currentUser?.role === 'ADMIN') &&
    !isAuthor &&
    document?.status === 'IN_REVIEW'
  const isSubmittingDecision = submittingDecision !== null

  let pageTitle = document?.title ?? 'Document'
  if (!isLoading && errorMessage) {
    pageTitle = isNotFound ? 'Document not found' : "Couldn't load document"
  }
  usePageTitle(pageTitle)

  return (
    <main>
      <Link
        to="/documents"
        className="inline-flex items-center gap-1 rounded-sm text-sm font-medium text-ink-subtle hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <span aria-hidden="true">←</span> Documents
      </Link>

      {isLoading && <DocumentDetailSkeleton />}

      {!isLoading && errorMessage && (
        <Card className="mt-4">
          <EmptyState
            icon={<DocumentIcon className="size-6" />}
            title={isNotFound ? 'Document not found' : "Couldn't load this document"}
            description={
              isNotFound
                ? "This document doesn't exist, or the link is wrong."
                : errorMessage
            }
            action={
              <Link to="/documents" className={buttonClasses('secondary')}>
                Back to documents
              </Link>
            }
          />
        </Card>
      )}

      {!isLoading && !errorMessage && document && (
        <>
          <header className="mt-4">
            <h1 className="text-2xl font-semibold tracking-tight break-words text-ink">
              {document.title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-ink-subtle">
              <StatusBadge status={document.status} />
              <span>
                Created by <span className="font-medium text-ink-muted">{document.createdByName}</span>
                {' · '}
                <time dateTime={document.createdAt}>{formatDateTime(document.createdAt)}</time>
              </span>
            </div>
          </header>

          {/*
            Phone: one column, ordered actions → content → history → comments (the order-* classes).
            Laptop: two columns. The wrappers are "display: contents" on phones, so their children
            take part in that single ordered column; from lg up they become the two real columns.
          */}
          <div className="mt-6 flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-8">
            <div className="contents lg:col-start-2 lg:row-start-1 lg:flex lg:flex-col lg:gap-6">
              <SidebarSection title="Actions" className="order-1">
                {canSubmitForReview && (
                  <div className="space-y-3">
                    <p className="text-sm text-ink-muted">
                      When it's ready, send it to a reviewer. Once submitted, it can't go back to draft.
                    </p>
                    <Button
                      className="w-full"
                      isLoading={isSubmittingForReview}
                      onClick={() => {
                        void handleSubmitForReview()
                      }}
                    >
                      {isSubmittingForReview ? 'Submitting…' : 'Submit for review'}
                    </Button>
                    {submitForReviewErrorMessage && (
                      <Alert variant="error">{submitForReviewErrorMessage}</Alert>
                    )}
                  </div>
                )}

                {canDecide && (
                  <form onSubmit={(event) => event.preventDefault()} className="space-y-3">
                    <div>
                      <label htmlFor="decisionComment" className={labelClasses}>
                        Comment <span className="font-normal text-ink-subtle">(optional)</span>
                      </label>
                      <textarea
                        id="decisionComment"
                        name="decisionComment"
                        rows={3}
                        placeholder="Explain your decision"
                        value={decisionComment}
                        onChange={(event) => setDecisionComment(event.target.value)}
                        className={inputClasses('resize-y')}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        isLoading={submittingDecision === 'APPROVE'}
                        disabled={isSubmittingDecision || !currentUser}
                        onClick={() => {
                          void handleDecisionSubmit('APPROVE')
                        }}
                      >
                        {submittingDecision === 'APPROVE' ? 'Approving…' : 'Approve'}
                      </Button>
                      <Button
                        variant="danger"
                        isLoading={submittingDecision === 'REJECT'}
                        disabled={isSubmittingDecision || !currentUser}
                        onClick={() => {
                          void handleDecisionSubmit('REJECT')
                        }}
                      >
                        {submittingDecision === 'REJECT' ? 'Rejecting…' : 'Reject'}
                      </Button>
                    </div>

                    {!currentUser && (
                      <Alert variant="info">You must be logged in to submit a decision.</Alert>
                    )}
                  </form>
                )}

                {!canSubmitForReview && !canDecide && (
                  <p className="text-sm text-ink-subtle">{getActionHint(document, currentUser, isAuthor)}</p>
                )}

                {/* Outside the form: after a conflict the form is gone, but the message must stay visible. */}
                {decisionErrorMessage && (
                  <Alert variant="error" className="mt-3">
                    {decisionErrorMessage}
                  </Alert>
                )}
              </SidebarSection>

              <SidebarSection title="Decision history" className="order-3">
                {decisions.length === 0 ? (
                  <p className="text-sm text-ink-subtle">No decisions yet.</p>
                ) : (
                  <DecisionTimeline decisions={decisions} />
                )}
              </SidebarSection>
            </div>

            <div className="contents lg:col-start-1 lg:row-start-1 lg:flex lg:flex-col lg:gap-6">
              <Card className="order-2">
                <h2 className="sr-only">Content</h2>
                <p className="leading-relaxed break-words whitespace-pre-wrap text-ink">
                  {document.content}
                </p>
              </Card>

              <section aria-labelledby="comments-title" className="order-4">
                <h2 id="comments-title" className="text-base font-semibold text-ink">
                  Comments{' '}
                  <span className="font-normal text-ink-subtle tabular-nums">({comments.length})</span>
                </h2>

                <Card padded={false} className="mt-3">
                  {comments.length === 0 ? (
                    <p className="px-4 py-6 text-center text-sm text-ink-subtle sm:px-6">
                      No comments yet. Start the discussion below.
                    </p>
                  ) : (
                    <ul className="divide-y divide-line">
                      {comments.map((comment) => (
                        <li key={comment.id} className="flex gap-3 px-4 py-4 sm:px-6">
                          <Avatar name={comment.authorName} />
                          <div className="min-w-0 flex-1">
                            <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
                              <span className="font-medium text-ink">{comment.authorName}</span>
                              <time dateTime={comment.createdAt} className="text-xs text-ink-subtle">
                                {formatDateTime(comment.createdAt)}
                              </time>
                            </p>
                            <p className="mt-1 text-sm break-words whitespace-pre-wrap text-ink-muted">
                              {comment.content}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}

                  <form
                    onSubmit={handleCommentSubmit}
                    className="space-y-3 border-t border-line bg-canvas/60 px-4 py-4 sm:px-6"
                  >
                    <div>
                      <label htmlFor="commentContent" className={labelClasses}>
                        Add a comment
                      </label>
                      <textarea
                        id="commentContent"
                        name="content"
                        rows={3}
                        placeholder="Write a comment…"
                        value={commentContent}
                        onChange={(event) => setCommentContent(event.target.value)}
                        required
                        className={inputClasses('resize-y')}
                      />
                    </div>

                    {!currentUser && (
                      <Alert variant="info">You must be logged in to add a comment.</Alert>
                    )}
                    {commentErrorMessage && <Alert variant="error">{commentErrorMessage}</Alert>}

                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        isLoading={isSubmittingComment}
                        disabled={!currentUser}
                      >
                        {isSubmittingComment ? 'Posting…' : 'Add comment'}
                      </Button>
                    </div>
                  </form>
                </Card>
              </section>
            </div>
          </div>
        </>
      )}
    </main>
  )
}

// Explains why no action button is shown. The server enforces the same rules.
function getActionHint(document: Document, currentUser: CurrentUser | null, isAuthor: boolean): string {
  const isReviewerOrAdmin = currentUser?.role === 'REVIEWER' || currentUser?.role === 'ADMIN'

  switch (document.status) {
    case 'DRAFT':
      return `This is a draft. Waiting for ${document.createdByName} to submit it for review.`
    case 'IN_REVIEW':
      if (isAuthor && isReviewerOrAdmin) {
        return "You can't review your own document. Another reviewer or an admin has to decide."
      }
      return isAuthor
        ? 'Waiting for a reviewer. Their decision will show up here.'
        : 'Waiting for a reviewer.'
    case 'APPROVED':
      return 'This document was approved. The decision is final.'
    case 'REJECTED':
      return 'This document was rejected. The decision is final.'
    default:
      return 'No actions available.'
  }
}

function SidebarSection({
  title,
  className,
  children,
}: {
  title: string
  className?: string
  children: ReactNode
}) {
  const headingId = `section-${title.toLowerCase().replace(/\s+/g, '-')}`

  return (
    <Card className={className}>
      <section aria-labelledby={headingId}>
        <h2 id={headingId} className="mb-4 text-sm font-semibold text-ink">
          {title}
        </h2>
        {children}
      </section>
    </Card>
  )
}

// A vertical line with one colored dot per decision, oldest first.
function DecisionTimeline({ decisions }: { decisions: ApprovalDecision[] }) {
  return (
    <ol className="relative space-y-5 border-l border-line pl-5">
      {decisions.map((decision) => {
        const isApproval = decision.decision === 'APPROVE'

        return (
          <li key={decision.id} className="relative">
            <span
              aria-hidden="true"
              className={cn(
                'absolute top-1 -left-[25px] size-2.5 rounded-full ring-4 ring-surface',
                isApproval ? 'bg-approved-dot' : 'bg-rejected-dot',
              )}
            />
            <p className="text-sm text-ink">
              <span className={cn('font-semibold', isApproval ? 'text-approved-text' : 'text-rejected-text')}>
                {isApproval ? 'Approved' : 'Rejected'}
              </span>{' '}
              by <span className="font-medium">{decision.decidedByName}</span>
            </p>
            <time dateTime={decision.decidedAt} className="text-xs text-ink-subtle">
              {formatDateTime(decision.decidedAt)}
            </time>
            {decision.comment && (
              <p className="mt-2 rounded-md bg-canvas px-3 py-2 text-sm break-words whitespace-pre-wrap text-ink-muted">
                {decision.comment}
              </p>
            )}
          </li>
        )
      })}
    </ol>
  )
}

// Gray placeholders in the shape of the page while it loads.
function DocumentDetailSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading document" className="mt-4 animate-pulse">
      <div className="h-7 w-2/3 rounded bg-surface-muted" />
      <div className="mt-3 flex gap-3">
        <div className="h-5 w-20 rounded-full bg-surface-muted" />
        <div className="h-5 w-48 rounded bg-surface-muted" />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-8">
        <Card className="space-y-3">
          <div className="h-4 rounded bg-surface-muted" />
          <div className="h-4 rounded bg-surface-muted" />
          <div className="h-4 w-4/5 rounded bg-surface-muted" />
        </Card>
        <Card className="space-y-3">
          <div className="h-4 w-1/3 rounded bg-surface-muted" />
          <div className="h-10 rounded bg-surface-muted" />
        </Card>
      </div>
    </div>
  )
}

export default DocumentDetailPage
