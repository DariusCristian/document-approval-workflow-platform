import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
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
import { useAuth } from '../app/AuthContext'

function DocumentDetailPage() {
  const { currentUser } = useAuth()
  const { id } = useParams()
  const documentId = Number(id)
  const [document, setDocument] = useState<Document | null>(null)
  const [comments, setComments] = useState<DocumentComment[]>([])
  const [decisions, setDecisions] = useState<ApprovalDecision[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [commentContent, setCommentContent] = useState('')
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [commentErrorMessage, setCommentErrorMessage] = useState('')
  const [decisionComment, setDecisionComment] = useState('')
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false)
  const [decisionErrorMessage, setDecisionErrorMessage] = useState('')
  const [isSubmittingForReview, setIsSubmittingForReview] = useState(false)
  const [submitForReviewErrorMessage, setSubmitForReviewErrorMessage] = useState('')

  useEffect(() => {
    if (!Number.isInteger(documentId) || documentId <= 0) {
      setErrorMessage('Invalid document id.')
      setIsLoading(false)
      return
    }

    let isCancelled = false

    const loadDocumentDetails = async () => {
      setIsLoading(true)
      setErrorMessage('')

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

    setIsSubmittingDecision(true)

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
    } finally {
      setIsSubmittingDecision(false)
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

  return (
    <main>
      <h1>Document Detail Page</h1>
      {isLoading && <p>Loading document details...</p>}
      {errorMessage && <p>{errorMessage}</p>}

      {!isLoading && !errorMessage && document && (
        <>
          <p>Document ID: {document.id}</p>
          <p>Title: {document.title}</p>
          <p>Content: {document.content}</p>
          <p>Status: {document.status}</p>
          <p>Created By ID: {document.createdById}</p>

          {document.status === 'DRAFT' && (
            <>
              <button
                type="button"
                disabled={isSubmittingForReview}
                onClick={() => {
                  void handleSubmitForReview()
                }}
              >
                {isSubmittingForReview ? 'Submitting for review...' : 'Submit for review'}
              </button>
              {submitForReviewErrorMessage && <p>{submitForReviewErrorMessage}</p>}
            </>
          )}

          <section>
            <h2>Comments</h2>
            <form onSubmit={handleCommentSubmit}>
              <div>
                <label htmlFor="content">Content</label>
                <textarea
                  id="content"
                  name="content"
                  value={commentContent}
                  onChange={(event) => setCommentContent(event.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingComment || !currentUser}
              >
                {isSubmittingComment ? 'Submitting comment...' : 'Add comment'}
              </button>
            </form>

            {!currentUser && <p>You must be logged in to add a comment.</p>}
            {commentErrorMessage && <p>{commentErrorMessage}</p>}

            {comments.length === 0 && <p>No comments yet.</p>}
            {comments.length > 0 && (
              <ul>
                {comments.map((comment) => (
                  <li key={comment.id}>
                    <p>Author ID: {comment.authorId}</p>
                    <p>Content: {comment.content}</p>
                    <p>Created At: {comment.createdAt}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2>Add Approval Decision</h2>
            <form onSubmit={(event) => event.preventDefault()}>
              <div>
                <label htmlFor="decisionComment">Comment (optional)</label>
                <textarea
                  id="decisionComment"
                  name="decisionComment"
                  value={decisionComment}
                  onChange={(event) => setDecisionComment(event.target.value)}
                />
              </div>

              <button
                type="button"
                disabled={isSubmittingDecision || !currentUser}
                onClick={() => {
                  void handleDecisionSubmit('APPROVE')
                }}
              >
                {isSubmittingDecision ? 'Submitting decision...' : 'Approve'}
              </button>

              <button
                type="button"
                disabled={isSubmittingDecision || !currentUser}
                onClick={() => {
                  void handleDecisionSubmit('REJECT')
                }}
              >
                {isSubmittingDecision ? 'Submitting decision...' : 'Reject'}
              </button>
            </form>

            {!currentUser && <p>You must be logged in to submit a decision.</p>}
            {decisionErrorMessage && <p>{decisionErrorMessage}</p>}
          </section>

          <section>
            <h2>Approval Decision History</h2>
            {decisions.length === 0 && <p>No decisions yet.</p>}
            {decisions.length > 0 && (
              <ul>
                {decisions.map((decision) => (
                  <li key={decision.id}>
                    <p>Decision: {decision.decision}</p>
                    <p>Decided By ID: {decision.decidedById}</p>
                    <p>Comment: {decision.comment || '-'}</p>
                    <p>Decided At: {decision.decidedAt}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      <p>
        Back to list: <Link to="/documents">Documents</Link>
      </p>
    </main>
  )
}

export default DocumentDetailPage
