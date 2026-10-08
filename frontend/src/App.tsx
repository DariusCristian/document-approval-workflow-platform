import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { useAuth } from './app/useAuth'
import LoginPage from './pages/LoginPage'
import DocumentsPage from './pages/DocumentsPage'
import DocumentDetailPage from './pages/DocumentDetailPage'
import CreateDocumentPage from './pages/CreateDocumentPage'
import AppHeader from './components/layout/AppHeader'
import SessionLoadingScreen from './components/layout/SessionLoadingScreen'

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
  return (
    <>
      <AppHeader />
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <Outlet />
      </div>
    </>
  )
}

function App() {
  const { isCheckingSession } = useAuth()

  // Wait for the session check, so routes don't briefly show the wrong page.
  if (isCheckingSession) {
    return <SessionLoadingScreen />
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
