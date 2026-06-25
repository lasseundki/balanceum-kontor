import { useState } from 'react'
import { ChevronDown, User, Home, Briefcase, Search } from 'lucide-react'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { useAuth } from '../../contexts/AuthContext'
import WorkspaceSwitcherSheet from './WorkspaceSwitcherSheet'
import SearchOverlay from '../SearchOverlay'
import type { WorkspaceType } from '../../types'

function wsIcon(type: WorkspaceType) {
  if (type === 'family')   return <Home size={15} />
  if (type === 'business') return <Briefcase size={15} />
  return <User size={15} />
}

function wsColor(type: WorkspaceType): string {
  if (type === 'family')   return '#7A9EC4'
  if (type === 'business') return '#6E6860'
  return '#7BA89B'
}

function initials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

export default function Header() {
  const { activeWorkspace } = useWorkspace()
  const { user } = useAuth()
  const [showSwitcher, setShowSwitcher] = useState(false)
  const [showSearch, setShowSearch] = useState(false)

  if (!activeWorkspace) return null

  const color = wsColor(activeWorkspace.type)
  const userInitials = initials(user?.displayName ?? user?.email ?? '?')

  return (
    <>
      <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur-sm border-b border-border safe-top">
        <div className="flex items-center justify-between px-4 h-14 max-w-lg mx-auto">

          {/* Workspace switcher */}
          <button
            onClick={() => setShowSwitcher(true)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 -ml-2 hover:bg-bg-subtle transition-colors"
          >
            <div className="w-7 h-7 rounded-md flex items-center justify-center text-white flex-shrink-0"
              style={{ backgroundColor: color }}>
              {wsIcon(activeWorkspace.type)}
            </div>
            <span className="text-sm font-semibold text-text max-w-[140px] truncate">
              {activeWorkspace.name}
            </span>
            <ChevronDown size={15} className="text-text-muted flex-shrink-0" />
          </button>

          <div className="flex items-center gap-2">
            {/* Search */}
            <button
              onClick={() => setShowSearch(true)}
              className="p-2 rounded-lg hover:bg-bg-subtle transition-colors text-text-muted hover:text-text"
            >
              <Search size={18} />
            </button>

            {/* Profile avatar */}
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
              {user?.photoURL
                ? <img src={user.photoURL} className="w-full h-full rounded-full object-cover" alt="" />
                : <span className="text-xs font-bold text-text-inverse">{userInitials}</span>
              }
            </div>
          </div>
        </div>
      </header>

      {showSwitcher && <WorkspaceSwitcherSheet onClose={() => setShowSwitcher(false)} />}
      {showSearch && <SearchOverlay onClose={() => setShowSearch(false)} />}
    </>
  )
}
