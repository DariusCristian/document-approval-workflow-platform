import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../app/useAuth'
import { createDocument } from '../api/documents'

function CreateDocumentPage() {
  const navigate = useNavigate()
  const { currentUser } = useAuth()

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
    <main className="legacy-page">
      <h1>Create Document</h1>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="title">Title</label>
          <input
            id="title"
            name="title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="content">Content</label>
          <textarea
            id="content"
            name="content"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            required
          />
        </div>

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Document'}
        </button>
      </form>

      {successMessage && <p>{successMessage}</p>}
      {errorMessage && <p>{errorMessage}</p>}
    </main>
  )
}

export default CreateDocumentPage
