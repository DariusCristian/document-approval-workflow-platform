import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../app/useAuth'
import { usePageTitle } from '../app/usePageTitle'
import { createDocument } from '../api/documents'
import Alert from '../components/ui/Alert'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { buttonClasses } from '../components/ui/buttonStyles'
import { inputClasses, labelClasses } from '../components/ui/formStyles'

function CreateDocumentPage() {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  usePageTitle('New document')

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    if (!currentUser) {
      setErrorMessage('You must be logged in to create a document.')
      return
    }

    const trimmedTitle = title.trim()
    const trimmedContent = content.trim()

    if (!trimmedTitle || !trimmedContent) {
      setErrorMessage('Title and content are required.')
      return
    }

    setIsSubmitting(true)

    try {
      const createdDocument = await createDocument(trimmedTitle, trimmedContent)

      setSuccessMessage('Document created successfully. Redirecting...')
      navigate(`/documents/${createdDocument.id}`)
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message)
      } else {
        setErrorMessage('Failed to create document.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="mx-auto max-w-2xl">
      <Link
        to="/documents"
        className="inline-flex items-center gap-1 rounded-sm text-sm font-medium text-ink-subtle hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <span aria-hidden="true">←</span> Documents
      </Link>

      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ink">New document</h1>
      <p className="mt-1 text-sm text-ink-subtle">Write it now, send it for review when it's ready.</p>

      <Card className="mt-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {errorMessage && <Alert variant="error">{errorMessage}</Alert>}
          {successMessage && <Alert variant="success">{successMessage}</Alert>}

          <div>
            <label htmlFor="title" className={labelClasses}>
              Title
            </label>
            <input
              id="title"
              name="title"
              type="text"
              placeholder="e.g. Remote Work Policy 2027"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              className={inputClasses()}
            />
          </div>

          <div>
            <label htmlFor="content" className={labelClasses}>
              Content
            </label>
            <textarea
              id="content"
              name="content"
              rows={12}
              placeholder="Write the document here…"
              aria-describedby="content-hint"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              required
              className={inputClasses('resize-y')}
            />
            <p id="content-hint" className="mt-1.5 text-xs text-ink-subtle">
              Saved as a draft. You can submit it for review afterwards.
            </p>
          </div>

          {/* Phone: buttons stacked, the main action on top. Laptop: side by side on the right. */}
          <div className="flex flex-col-reverse gap-2 border-t border-line pt-5 sm:flex-row sm:justify-end">
            <Link to="/documents" className={buttonClasses('secondary')}>
              Cancel
            </Link>
            <Button type="submit" isLoading={isSubmitting}>
              {isSubmitting ? 'Creating…' : 'Create document'}
            </Button>
          </div>
        </form>
      </Card>
    </main>
  )
}

export default CreateDocumentPage
