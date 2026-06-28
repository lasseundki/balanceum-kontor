import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'

export default function ForgotPasswordPage() {
  const { t } = useTranslation()
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await resetPassword(email)
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg-subtle flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="Kontor" className="w-16 h-16 mx-auto mb-4" />
          <h1 className="font-heading text-3xl font-bold text-text">Balanceum Kontor</h1>
        </div>

        <div className="bg-surface border border-border rounded-xl p-6 shadow-md space-y-4">
          <h2 className="font-heading text-xl font-semibold text-text">{t('auth.resetTitle')}</h2>

          {sent ? (
            <div className="bg-success-light border border-success/20 text-accent-dark text-sm px-3 py-3 rounded-md">
              {t('auth.resetSent')}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">{t('auth.email')}</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  required placeholder="name@example.com"
                  className="w-full border border-border rounded-md px-3 py-2.5 text-sm text-text bg-surface focus:outline-none focus:border-accent focus:ring-3 focus:ring-accent-light" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-accent text-text-inverse py-2.5 rounded-lg font-semibold text-sm hover:bg-accent-hover transition-colors disabled:opacity-50">
                {loading ? t('common.loading') : t('auth.resetButton')}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-text-secondary mt-4">
          <Link to="/login" className="text-accent font-medium hover:text-accent-hover">{t('auth.back', { defaultValue: t('common.back') })}</Link>
        </p>
      </div>
    </div>
  )
}
