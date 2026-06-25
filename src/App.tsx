import { useState } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { WorkspaceProvider } from './contexts/WorkspaceContext'
import Header from './components/layout/Header'
import BottomNav from './components/layout/BottomNav'
import Dashboard from './pages/Dashboard'
import AddTransactionModal from './components/modals/AddTransactionModal'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import './i18n'

function AppLayout() {
  const [showAdd, setShowAdd] = useState(false)

  return (
    <div className="max-w-lg mx-auto min-h-screen bg-bg-subtle">
      <Header />
      <main className="pb-nav">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/transactions" element={<div className="p-6 font-sans text-text">Transaktionen (kommt)</div>} />
          <Route path="/analytics" element={<div className="p-6 font-sans text-text">Analyse (kommt)</div>} />
          <Route path="/settings" element={<div className="p-6 font-sans text-text">Einstellungen (kommt)</div>} />
          <Route path="/join" element={<div className="p-6 font-sans text-text">Workspace beitreten (kommt)</div>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <BottomNav onAdd={() => setShowAdd(true)} />
      {showAdd && <AddTransactionModal onClose={() => setShowAdd(false)} />}
    </div>
  )
}

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-accent rounded-xl mx-auto mb-3 flex items-center justify-center">
            <span className="font-heading text-xl font-bold text-text-inverse">K</span>
          </div>
          <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mt-3" />
        </div>
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
      <AppLayout />
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
