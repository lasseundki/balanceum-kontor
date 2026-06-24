import { createContext, useContext, useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from './AuthContext'
import { createPersonalWorkspace } from '../lib/workspace'
import type { UserWorkspaceMembership } from '../types'

const STORAGE_KEY = 'kontor_active_workspace'

interface WorkspaceContextType {
  workspaces: UserWorkspaceMembership[]
  activeWorkspaceId: string | null
  activeWorkspace: UserWorkspaceMembership | null
  loading: boolean
  switchWorkspace: (wsId: string) => void
}

const WorkspaceContext = createContext<WorkspaceContextType | null>(null)

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [workspaces, setWorkspaces] = useState<UserWorkspaceMembership[]>([])
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setWorkspaces([])
      setActiveWorkspaceId(null)
      setLoading(false)
      return
    }

    setLoading(true)
    const col = collection(db, 'users', user.uid, 'workspaces')
    const unsub = onSnapshot(col, async (snap) => {
      const list = snap.docs.map(d => ({ ...d.data(), workspaceId: d.id } as UserWorkspaceMembership))

      // First login: no workspaces exist yet → create personal workspace
      if (list.length === 0 && !snap.metadata.fromCache) {
        await createPersonalWorkspace(user.uid, user.displayName ?? user.email ?? 'Nutzer')
        return
      }

      setWorkspaces(list)

      // Restore last used workspace, or fall back to personal
      const stored = localStorage.getItem(STORAGE_KEY)
      const storedValid = stored && list.some(w => w.workspaceId === stored)
      if (storedValid) {
        setActiveWorkspaceId(stored)
      } else {
        const personal = list.find(w => w.type === 'personal') ?? list[0]
        setActiveWorkspaceId(personal?.workspaceId ?? null)
      }

      setLoading(false)
    })

    return unsub
  }, [user])

  function switchWorkspace(wsId: string) {
    setActiveWorkspaceId(wsId)
    localStorage.setItem(STORAGE_KEY, wsId)
  }

  const activeWorkspace = workspaces.find(w => w.workspaceId === activeWorkspaceId) ?? null

  return (
    <WorkspaceContext.Provider value={{ workspaces, activeWorkspaceId, activeWorkspace, loading, switchWorkspace }}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider')
  return ctx
}
