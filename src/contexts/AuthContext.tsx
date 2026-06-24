import { createContext, useContext, useEffect, useState } from 'react'
import type { User } from 'firebase/auth'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '../firebase/config'
import { createPersonalWorkspace } from '../lib/workspace'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string, remember: boolean) => Promise<void>
  register: (email: string, password: string, displayName: string) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
  }, [])

  async function login(email: string, password: string, remember: boolean) {
    await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence)
    await signInWithEmailAndPassword(auth, email, password)
  }

  async function register(email: string, password: string, displayName: string) {
    const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(newUser, { displayName })
    await setDoc(doc(db, 'users', newUser.uid), {
      displayName,
      email,
      language: 'de',
      currency: 'EUR',
      createdAt: Date.now(),
    })
    await createPersonalWorkspace(newUser.uid, displayName)
  }

  async function logout() {
    await signOut(auth)
  }

  async function resetPassword(email: string) {
    await sendPasswordResetEmail(auth, email)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, resetPassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
