import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDocuments } from '../api/documents'
import type { Document } from '../api/documents'

function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let isCancelled = false

    const loadDocuments = async () => {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const data = await getDocuments()
        if (!isCancelled) {
          setDocuments(data)
        }
      } catch (error) {
        if (isCancelled) {
          return
        }

        if (error instanceof Error) {
          setErrorMessage(error.message)
        } else {
          setErrorMessage('Failed to load documents.')
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadDocuments()

    return () => {
      isCancelled = true
    }
  }, [])

  return (
    <main>
      <h1>Documents Page</h1>
      {isLoading && <p>Loading documents...</p>}
      {errorMessage && <p>{errorMessage}</p>}

      {!isLoading && !errorMessage && documents.length === 0 && (
        <p>No documents found.</p>
      )}

      {!isLoading && !errorMessage && documents.length > 0 && (
        <ul>
          {documents.map((document) => (
            <li key={document.id}>
              <Link to={`/documents/${document.id}`}>{document.title}</Link>
              <p>Status: {document.status}</p>
              <p>Created By ID: {document.createdById}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}

export default DocumentsPage
