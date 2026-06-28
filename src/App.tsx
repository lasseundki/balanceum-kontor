import { useState, useEffect, useRef } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { WorkspaceProvider } from './contexts/WorkspaceContext'
import { useWorkspace } from './contexts/WorkspaceContext'
import { useRecurringTransactions } from './hooks/useWorkspaceFirestore'
import { generateRecurringTransactions } from './lib/recurringGenerator'
import Header from './components/layout/Header'
import BottomNav from './components/layout/BottomNav'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import JoinWorkspacePage from './pages/JoinWorkspacePage'
import AddTransactionModal from './components/modals/AddTransactionModal'
import OnboardingFlow from './components/OnboardingFlow'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import './i18n'

function RecurringGeneratorEffect() {
  const { activeWorkspaceId } = useWorkspace()
  const recurring = useRecurringTransactions()
  const ranRef = useRef<string | null>(null)

  useEffect(() => {
    if (!activeWorkspaceId || recurring.length === 0) return
    const key = `${activeWorkspaceId}-${recurring.map(r => r.id).join(',')}`
    if (ranRef.current === key) return
    ranRef.current = key
    generateRecurringTransactions(activeWorkspaceId, recurring).catch(console.error)
  }, [activeWorkspaceId, recurring])

  return null
}

function AppLayout() {
  const [showAdd, setShowAdd] = useState(false)
  const [onboarded, setOnboarded] = useState(() => localStorage.getItem('onboarded') === 'true')

  return (
    <div className="max-w-lg mx-auto min-h-screen bg-bg-subtle">
      <RecurringGeneratorEffect />
      <Header />
      <main className="pb-nav">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/join" element={<JoinWorkspacePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <BottomNav onAdd={() => setShowAdd(true)} />
      {showAdd && <AddTransactionModal onClose={() => setShowAdd(false)} />}
      {!onboarded && <OnboardingFlow onDone={() => setOnboarded(true)} />}
    </div>
  )
}

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-subtle flex items-center justify-center">
        <div className="text-center">
          <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="Kontor" className="w-14 h-14 mx-auto mb-3" />
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
