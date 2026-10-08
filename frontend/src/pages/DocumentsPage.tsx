import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { getDocuments } from '../api/documents'
import type { Document } from '../api/documents'
import Alert from '../components/ui/Alert'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import EmptyState from '../components/ui/EmptyState'
import StatusBadge from '../components/ui/StatusBadge'
import { buttonClasses } from '../components/ui/buttonStyles'
import { ChevronRightIcon, DocumentIcon, PlusIcon } from '../components/ui/icons'
import { cn } from '../utils/cn'
import { DOCUMENT_STATUSES, getStatusLabel, isDocumentStatus } from '../utils/documentStatus'
import type { DocumentStatus } from '../utils/documentStatus'
import { formatDate } from '../utils/formatDate'

type StatusFilter = DocumentStatus | 'ALL'

const FILTERS: StatusFilter[] = ['ALL', ...DOCUMENT_STATUSES]

function DocumentsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  // Changing this number loads the documents again ("Try again").
  const [reloadCount, setReloadCount] = useState(0)

  // The filter lives in the URL (?status=IN_REVIEW), so it survives opening a document and going back.
  const statusParam = searchParams.get('status')
  const statusFilter: StatusFilter = isDocumentStatus(statusParam) ? statusParam : 'ALL'

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
  }, [reloadCount])

  const setStatusFilter = (filter: StatusFilter) => {
    setSearchParams(filter === 'ALL' ? {} : { status: filter }, { replace: true })
  }

  const countFor = (filter: StatusFilter) =>
    filter === 'ALL' ? documents.length : documents.filter((document) => document.status === filter).length

  const visibleDocuments =
    statusFilter === 'ALL' ? documents : documents.filter((document) => document.status === statusFilter)

  const hasLoaded = !isLoading && !errorMessage

  return (
    <main>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Documents</h1>
          <p className="mt-1 text-sm text-ink-subtle">
            {hasLoaded
              ? `${documents.length} ${documents.length === 1 ? 'document' : 'documents'}`
              : 'All documents in your workspace'}
          </p>
        </div>
        <Link to="/documents/create" className={buttonClasses('primary', 'md', 'shrink-0')}>
          <PlusIcon className="size-4" />
          New document
        </Link>
      </div>

      {hasLoaded && documents.length > 0 && (
        // Scrolls sideways by itself on narrow screens, so the page never does.
        <div className="-mx-4 mt-6 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div role="group" aria-label="Filter by status" className="flex w-max gap-1 rounded-lg bg-surface-muted p-1">
            {FILTERS.map((filter) => {
              const isActive = filter === statusFilter
              return (
                <button
                  key={filter}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setStatusFilter(filter)}
                  className={cn(
                    'flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors',
                    'focus-visible:outline-2 focus-visible:outline-accent',
                    isActive ? 'bg-surface text-ink shadow-xs' : 'text-ink-muted hover:text-ink',
                  )}
                >
                  {filter === 'ALL' ? 'All' : getStatusLabel(filter)}
                  <span
                    className={cn(
                      'rounded-full px-1.5 text-xs tabular-nums',
                      isActive ? 'bg-accent-soft text-accent' : 'bg-surface text-ink-subtle',
                    )}
                  >
                    {countFor(filter)}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="mt-4">
        {isLoading && <DocumentListSkeleton />}

        {!isLoading && errorMessage && (
          <Alert
            variant="error"
            title="Couldn't load documents"
            action={
              <Button variant="secondary" size="sm" onClick={() => setReloadCount((count) => count + 1)}>
                Try again
              </Button>
            }
          >
            {errorMessage}
          </Alert>
        )}

        {hasLoaded && documents.length === 0 && (
          <Card>
            <EmptyState
              icon={<DocumentIcon className="size-6" />}
              title="No documents yet"
              description="Documents you and your team write will show up here."
              action={
                <Link to="/documents/create" className={buttonClasses('primary')}>
                  <PlusIcon className="size-4" />
                  Create your first document
                </Link>
              }
            />
          </Card>
        )}

        {hasLoaded && documents.length > 0 && visibleDocuments.length === 0 && (
          <Card>
            <EmptyState
              icon={<DocumentIcon className="size-6" />}
              title={`No ${getStatusLabel(statusFilter).toLowerCase()} documents`}
              description="Try another status, or show all documents."
              action={
                <Button variant="secondary" onClick={() => setStatusFilter('ALL')}>
                  Show all documents
                </Button>
              }
            />
          </Card>
        )}

        {hasLoaded && visibleDocuments.length > 0 && (
          <>
            {/* Laptop and up: a table. */}
            <Card padded={false} className="hidden overflow-hidden md:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-line bg-canvas text-xs font-medium tracking-wide text-ink-subtle uppercase">
                  <tr>
                    <th scope="col" className="px-6 py-3 font-medium">Title</th>
                    <th scope="col" className="px-6 py-3 font-medium">Status</th>
                    <th scope="col" className="px-6 py-3 font-medium">Author</th>
                    <th scope="col" className="px-6 py-3 text-right font-medium">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {visibleDocuments.map((document) => (
                    <tr
                      key={document.id}
                      // The whole row opens the document; the title link stays for keyboard,
                      // screen readers and opening in a new tab.
                      onClick={(event) => {
                        if (!(event.target as HTMLElement).closest('a')) {
                          navigate(`/documents/${document.id}`)
                        }
                      }}
                      className="cursor-pointer transition-colors hover:bg-canvas"
                    >
                      <td className="px-6 py-4">
                        <Link
                          to={`/documents/${document.id}`}
                          className="font-medium text-ink hover:text-accent focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                        >
                          {document.title}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={document.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-ink-muted">{document.createdByName}</td>
                      <td className="px-6 py-4 text-right whitespace-nowrap text-ink-subtle tabular-nums">
                        <time dateTime={document.createdAt}>{formatDate(document.createdAt)}</time>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            {/* Phone: one card per document. */}
            <ul className="space-y-3 md:hidden">
              {visibleDocuments.map((document) => (
                <li key={document.id}>
                  <Link
                    to={`/documents/${document.id}`}
                    className="flex items-center gap-3 rounded-xl border border-line bg-surface p-4 shadow-xs transition-colors hover:bg-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-medium text-ink">{document.title}</p>
                        <StatusBadge status={document.status} className="shrink-0" />
                      </div>
                      <p className="mt-1.5 text-sm text-ink-subtle">
                        {document.createdByName} ·{' '}
                        <time dateTime={document.createdAt}>{formatDate(document.createdAt)}</time>
                      </p>
                    </div>
                    <ChevronRightIcon className="size-4 shrink-0 text-ink-subtle" />
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </main>
  )
}

// Gray placeholder rows while the documents load.
function DocumentListSkeleton() {
  return (
    <Card padded={false} aria-busy="true" aria-label="Loading documents" className="divide-y divide-line">
      {[0, 1, 2, 3].map((row) => (
        <div key={row} className="flex animate-pulse items-center gap-4 px-4 py-4 sm:px-6">
          <div className="h-4 flex-1 rounded bg-surface-muted" />
          <div className="h-5 w-20 rounded-full bg-surface-muted" />
          <div className="hidden h-4 w-28 rounded bg-surface-muted md:block" />
          <div className="hidden h-4 w-20 rounded bg-surface-muted md:block" />
        </div>
      ))}
    </Card>
  )
}

export default DocumentsPage
