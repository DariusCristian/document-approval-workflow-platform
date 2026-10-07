import { Link, Navigate, Outlet, Route, Routes, useNavigate } from 'react-router-dom'
import { useAuth } from './app/useAuth'
import LoginPage from './pages/LoginPage'
import DocumentsPage from './pages/DocumentsPage'
import DocumentDetailPage from './pages/DocumentDetailPage'
import CreateDocumentPage from './pages/CreateDocumentPage'

function RootRedirect() {
  const { currentUser } = useAuth()
  return <Navigate to={currentUser ? '/documents' : '/login'} replace />
}

function PublicOnlyRoute() {
  const { currentUser } = useAuth()
  if (currentUser) {
    return <Navigate to="/documents" replace />
  }

  return <Outlet />
}

function ProtectedRoute() {
  const { currentUser } = useAuth()
  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  return <ProtectedLayout />
}

function ProtectedLayout() {
  const navigate = useNavigate()
  const { logout, currentUser } = useAuth()

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <>
      <header>
        <nav>
          <Link to="/documents">Documents</Link> |{' '}
          <Link to="/documents/create">Create Document</Link>
        </nav>
        {currentUser && (
          <p>
            Signed in as {currentUser.email} ({currentUser.role})
          </p>
        )}
        <button
          type="button"
          onClick={() => {
            void handleLogout()
          }}
        >
          Logout
        </button>
      </header>
      <Outlet />
    </>
  )
}

function App() {
  const { isCheckingSession } = useAuth()

  // Wait for the session check, so routes don't briefly show the wrong page.
  if (isCheckingSession) {
    return <p>Loading...</p>
  }

  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />

      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/documents/create" element={<CreateDocumentPage />} />
        <Route path="/documents/:id" element={<DocumentDetailPage />} />
      </Route>

      <Route path="*" element={<RootRedirect />} />
    </Routes>
  )
}

export default App
