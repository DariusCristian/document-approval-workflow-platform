import { Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import DocumentsPage from './pages/DocumentsPage'
import DocumentDetailPage from './pages/DocumentDetailPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/documents" element={<DocumentsPage />} />
      <Route path="/documents/:id" element={<DocumentDetailPage />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
