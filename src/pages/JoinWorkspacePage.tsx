import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { useWorkspace } from '../contexts/WorkspaceContext'
import { joinWorkspaceByCode } from '../lib/workspace'

export default function JoinWorkspacePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const { switchWorkspace } = useWorkspace()

  const [code, setCode] = useState(searchParams.get('code') ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const codeFromUrl = searchParams.get('code')
    if (codeFromUrl && codeFromUrl.length === 6) {
      setCode(codeFromUrl.toUpperCase())
    }
  }, [searchParams])

  async function handleJoin() {
    if (!user || code.trim().length < 4) return
    setLoading(true)
    setError('')
    const result = await joinWorkspaceByCode(user.uid, user.displayName ?? user.email ?? 'Nutzer', code.trim())
    if ('error' in result) {
      setError(t('workspace.joinCodeError'))
      setLoading(false)
    } else {
      switchWorkspace(result.wsId)
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen bg-bg-subtle flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-surface rounded-2xl shadow-lg p-6 space-y-5">
        <div className="text-center">
          <div className="w-14 h-14 bg-accent rounded-xl mx-auto mb-3 flex items-center justify-center">
            <span className="font-heading text-2xl font-bold text-text-inverse">K</span>
          </div>
          <h1 className="font-heading text-xl font-bold text-text">{t('workspace.joinTitle')}</h1>
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-1.5">{t('workspace.joinCode')}</label>
          <input
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
            placeholder={t('workspace.joinCodePlaceholder')}
            maxLength={8}
            autoFocus
            className="w-full border border-border rounded-md px-3 py-3 text-xl font-bold text-text bg-surface focus:outline-none focus:border-accent focus:ring-3 focus:ring-accent-light text-center tracking-widest uppercase"
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
          />
          {error && <p className="text-xs text-error mt-1.5">{error}</p>}
        </div>

        <button
          onClick={handleJoin}
          disabled={loading || code.trim().length < 4}
          className="w-full bg-accent text-text-inverse py-3 rounded-lg font-semibold text-sm hover:bg-accent-hover transition-colors disabled:opacity-40"
        >
          {loading ? t('workspace.joining') : t('workspace.join')}
        </button>

        <button onClick={() => navigate('/')} className="w-full text-sm text-text-muted hover:text-text transition-colors">
          {t('common.back')}
        </button>
      </div>
    </div>
  )
}
