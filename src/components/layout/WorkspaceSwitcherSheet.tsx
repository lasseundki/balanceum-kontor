import { useState } from 'react'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { useTranslation } from 'react-i18next'
import { Check, User, Home, Briefcase, Plus, LogIn } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import NewWorkspaceModal from '../modals/NewWorkspaceModal'
import type { WorkspaceType } from '../../types'

interface Props {
  onClose: () => void
}

function wsIcon(type: WorkspaceType) {
  if (type === 'family')   return <Home size={16} />
  if (type === 'business') return <Briefcase size={16} />
  return <User size={16} />
}

function wsColor(type: WorkspaceType): string {
  if (type === 'family')   return '#7A9EC4'
  if (type === 'business') return '#6E6860'
  return '#7BA89B'
}

export default function WorkspaceSwitcherSheet({ onClose }: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { workspaces, activeWorkspaceId, switchWorkspace } = useWorkspace()
  const [showNewWs, setShowNewWs] = useState(false)

  const sorted = [...workspaces].sort((a, b) => {
    if (a.type === 'personal') return -1
    if (b.type === 'personal') return 1
    return a.name.localeCompare(b.name)
  })

  function handleSwitch(wsId: string) {
    switchWorkspace(wsId)
    onClose()
  }

  return (
    <>
      {/* Transparent backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Dropdown panel — positioned below the header */}
      <div className="fixed top-14 left-3 z-50 w-72 bg-surface rounded-xl shadow-xl border border-border overflow-hidden">
        <div className="py-1.5">
          {sorted.map(ws => {
            const active = ws.workspaceId === activeWorkspaceId
            const color = wsColor(ws.type)
            return (
              <button
                key={ws.workspaceId}
                onClick={() => handleSwitch(ws.workspaceId)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-bg-subtle transition-colors text-left"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white"
                  style={{ backgroundColor: color }}
                >
                  {wsIcon(ws.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text truncate">{ws.name}</p>
                  <p className="text-xs text-text-muted">{t(`workspace.${ws.type}`)}</p>
                </div>
                {active && <Check size={16} className="text-accent flex-shrink-0" />}
              </button>
            )
          })}
        </div>

        <div className="border-t border-border px-3 py-2 space-y-1">
          <button
            onClick={() => { setShowNewWs(true) }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-dashed border-border hover:border-accent hover:bg-accent-light/30 transition-colors text-text-secondary hover:text-accent"
          >
            <Plus size={16} />
            <span className="text-sm font-medium">{t('workspace.create')}</span>
          </button>
          <button
            onClick={() => { onClose(); navigate('/join') }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-bg-subtle transition-colors text-text-secondary"
          >
            <LogIn size={16} />
            <span className="text-sm font-medium">{t('workspace.joinTitle')}</span>
          </button>
        </div>
      </div>

      {showNewWs && <NewWorkspaceModal onClose={() => { setShowNewWs(false); onClose() }} />}
    </>
  )
}
