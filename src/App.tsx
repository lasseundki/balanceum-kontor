import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { WorkspaceProvider } from './contexts/WorkspaceContext'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
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
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <WorkspaceProvider>
      <Routes>
        <Route path="/" element={<div className="p-8 font-sans text-text">Dashboard (kommt)</div>} />
        <Route path="/transactions" element={<div className="p-8 font-sans text-text">Transaktionen (kommt)</div>} />
        <Route path="/analytics" element={<div className="p-8 font-sans text-text">Analyse (kommt)</div>} />
        <Route path="/settings" element={<div className="p-8 font-sans text-text">Einstellungen (kommt)</div>} />
        <Route path="/join" element={<div className="p-8 font-sans text-text">Workspace beitreten (kommt)</div>} />
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
