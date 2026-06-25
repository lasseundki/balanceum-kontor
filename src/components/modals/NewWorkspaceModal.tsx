import { useState } from 'react'
import { X, User, Home, Briefcase } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { createWorkspace } from '../../lib/workspace'
import { CURRENCIES } from '../../lib/currency'
import type { WorkspaceType } from '../../types'

interface Props {
  onClose: () => void
}

const TYPES: { key: WorkspaceType; icon: React.ReactNode; labelKey: string }[] = [
  { key: 'personal',  icon: <User size={18} />,     labelKey: 'workspace.personal'  },
  { key: 'family',    icon: <Home size={18} />,     labelKey: 'workspace.family'    },
  { key: 'business',  icon: <Briefcase size={18} />, labelKey: 'workspace.business' },
]

const TYPE_COLORS: Record<WorkspaceType, string> = {
  personal: '#7BA89B', family: '#7A9EC4', business: '#6E6860',
}

export default function NewWorkspaceModal({ onClose }: Props) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { switchWorkspace } = useWorkspace()

  const [name, setName] = useState('')
  const [type, setType] = useState<WorkspaceType>('personal')
  const [currency, setCurrency] = useState('EUR')
  const [saving, setSaving] = useState(false)
  const [showCurrencies, setShowCurrencies] = useState(false)

  async function handleCreate() {
    if (!name.trim() || !user) return
    setSaving(true)
    const wsId = await createWorkspace(user.uid, user.displayName ?? user.email ?? 'Nutzer', name.trim(), type, currency)
    switchWorkspace(wsId)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full bg-surface rounded-t-xl shadow-xl max-h-[85vh] overflow-y-auto max-w-lg mx-auto">
        <div className="sticky top-0 bg-surface border-b border-border px-4 py-3 flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold text-text">{t('workspace.create')}</h2>
          <button onClick={onClose} className="p-1.5 rounded-md text-text-muted hover:bg-bg-muted transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-5 pb-8">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">{t('workspace.newName')}</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t('workspace.newNamePlaceholder')}
              autoFocus
              className="w-full border border-border rounded-md px-3 py-2.5 text-sm text-text bg-surface focus:outline-none focus:border-accent focus:ring-3 focus:ring-accent-light"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-text mb-2">{t('common.category')}</label>
            <div className="grid grid-cols-3 gap-2">
              {TYPES.map(tp => (
                <button
                  key={tp.key}
                  onClick={() => setType(tp.key)}
                  className={`flex flex-col items-center gap-2 py-3 rounded-xl border-2 transition-colors ${
                    type === tp.key ? 'border-accent bg-accent-light' : 'border-border hover:bg-bg-subtle'
                  }`}
                >
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white"
                    style={{ backgroundColor: TYPE_COLORS[tp.key] }}>
                    {tp.icon}
                  </div>
                  <span className="text-xs font-medium text-text">{t(tp.labelKey)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Currency */}
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">{t('workspace.currency')}</label>
            {!showCurrencies ? (
              <button
                onClick={() => setShowCurrencies(true)}
                className="w-full flex items-center justify-between px-3 py-2.5 border border-border rounded-md text-sm text-text bg-surface hover:bg-bg-subtle transition-colors"
              >
                <span>{currency}</span>
                <span className="text-text-muted text-xs">▼</span>
              </button>
            ) : (
              <div className="border border-border rounded-md overflow-hidden max-h-48 overflow-y-auto">
                {CURRENCIES.map(c => (
                  <button
                    key={c.code}
                    onClick={() => { setCurrency(c.code); setShowCurrencies(false) }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-bg-subtle text-sm transition-colors ${currency === c.code ? 'bg-accent-light' : ''}`}
                  >
                    <span>{c.flag}</span>
                    <span className="font-medium text-text">{c.code}</span>
                    <span className="text-text-muted">{c.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleCreate}
            disabled={saving || !name.trim()}
            className="w-full bg-accent text-text-inverse py-3 rounded-lg font-semibold text-sm hover:bg-accent-hover transition-colors disabled:opacity-40"
          >
            {saving ? t('common.saving') : t('workspace.create')}
          </button>
        </div>
      </div>
    </div>
  )
}
