import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { WorkspaceProvider } from './contexts/WorkspaceContext'
import './i18n'

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-subtle flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<div className="p-8 text-text font-sans">Login (kommt)</div>} />
        <Route path="/register" element={<div className="p-8 text-text font-sans">Register (kommt)</div>} />
        <Route path="/forgot-password" element={<div className="p-8 text-text font-sans">Passwort zurücksetzen (kommt)</div>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <WorkspaceProvider>
      <Routes>
        <Route path="/" element={<div className="p-8 text-text font-sans">Dashboard (kommt)</div>} />
        <Route path="/transactions" element={<div className="p-8 text-text font-sans">Transaktionen (kommt)</div>} />
        <Route path="/analytics" element={<div className="p-8 text-text font-sans">Analyse (kommt)</div>} />
        <Route path="/settings" element={<div className="p-8 text-text font-sans">Einstellungen (kommt)</div>} />
        <Route path="/join" element={<div className="p-8 text-text font-sans">Workspace beitreten (kommt)</div>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </WorkspaceProvider>
  )
}

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </HashRouter>
  )
}
