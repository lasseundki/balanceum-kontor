import { useWorkspace } from '../../contexts/WorkspaceContext'
import { useTranslation } from 'react-i18next'
import { Check, User, Home, Briefcase, Plus, X } from 'lucide-react'
import type { WorkspaceType } from '../../types'

interface Props {
  onClose: () => void
}

function wsIcon(type: WorkspaceType) {
  if (type === 'family')   return <Home size={18} />
  if (type === 'business') return <Briefcase size={18} />
  return <User size={18} />
}

function wsColor(type: WorkspaceType): string {
  if (type === 'family')   return '#7A9EC4'
  if (type === 'business') return '#6E6860'
  return '#7BA89B'
}

export default function WorkspaceSwitcherSheet({ onClose }: Props) {
  const { t } = useTranslation()
  const { workspaces, activeWorkspaceId, switchWorkspace } = useWorkspace()

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
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-2xl shadow-xl max-w-lg mx-auto">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border">
          <h2 className="font-heading text-base font-semibold text-text">{t('workspace.switch')}</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text transition-colors p-1">
            <X size={18} />
          </button>
        </div>

        <div className="py-2">
          {sorted.map(ws => {
            const active = ws.workspaceId === activeWorkspaceId
            const color = wsColor(ws.type)
            return (
              <button
                key={ws.workspaceId}
                onClick={() => handleSwitch(ws.workspaceId)}
                className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-bg-subtle transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-white"
                  style={{ backgroundColor: color }}>
                  {wsIcon(ws.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text truncate">{ws.name}</p>
                  <p className="text-xs text-text-muted">{t(`workspace.${ws.type}`)}</p>
                </div>
                {active && <Check size={18} className="text-accent flex-shrink-0" />}
              </button>
            )
          })}
        </div>

        <div className="px-4 pb-4 pt-2 border-t border-border safe-bottom">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-border hover:border-accent hover:bg-accent-light/30 transition-colors text-text-secondary hover:text-accent">
            <Plus size={18} />
            <span className="text-sm font-medium">{t('workspace.create')}</span>
          </button>
        </div>
      </div>
    </>
  )
}
