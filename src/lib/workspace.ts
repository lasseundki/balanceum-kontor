import { collection, doc, writeBatch } from 'firebase/firestore'
import { db } from '../firebase/config'
import type { Workspace, WorkspaceMember, UserWorkspaceMembership, Category, PaymentMethod, LabelMember } from '../types'

const DEFAULT_CATEGORIES: Omit<Category, 'id'>[] = [
  { name: 'Wohnen',      icon: '🏠', color: '#7BA89B', type: 'expense', order: 0 },
  { name: 'Lebensmittel',icon: '🛒', color: '#C9A05A', type: 'expense', order: 1 },
  { name: 'Transport',   icon: '🚗', color: '#7A9EC4', type: 'expense', order: 2 },
  { name: 'Gesundheit',  icon: '💊', color: '#C47A91', type: 'expense', order: 3 },
  { name: 'Freizeit',    icon: '🎉', color: '#A891C4', type: 'expense', order: 4 },
  { name: 'Restaurant',  icon: '🍽️', color: '#7AB4C4', type: 'expense', order: 5 },
  { name: 'Kleidung',    icon: '👕', color: '#C9A05A', type: 'expense', order: 6 },
  { name: 'Bildung',     icon: '📚', color: '#7A9EC4', type: 'expense', order: 7 },
  { name: 'Reisen',      icon: '✈️', color: '#7BA89B', type: 'expense', order: 8 },
  { name: 'Technik',     icon: '💻', color: '#A891C4', type: 'expense', order: 9 },
  { name: 'Haushalt',    icon: '🧹', color: '#C47A91', type: 'expense', order: 10 },
  { name: 'Fixkosten',   icon: '📋', color: '#6E6860', type: 'expense', order: 11 },
  { name: 'Business',    icon: '💼', color: '#3D6B5E', type: 'both',    order: 12 },
  { name: 'Gehalt',      icon: '💰', color: '#7BA89B', type: 'income',  order: 13 },
  { name: 'Provision',   icon: '📈', color: '#C9A05A', type: 'income',  order: 14 },
  { name: 'Sonstiges',   icon: '📌', color: '#A09890', type: 'both',    order: 15 },
]

const DEFAULT_PAYMENT_METHODS: Omit<PaymentMethod, 'id'>[] = [
  { name: 'Bar',          type: 'cash',     color: '#C9A05A' },
  { name: 'Überweisung',  type: 'transfer', color: '#7A9EC4' },
  { name: 'Kreditkarte',  type: 'card',     color: '#7BA89B' },
]

export async function createPersonalWorkspace(uid: string, displayName: string): Promise<string> {
  const wsRef = doc(collection(db, 'workspaces'))
  const wsId = wsRef.id
  const now = Date.now()

  const batch = writeBatch(db)

  const workspace: Omit<Workspace, 'id'> = {
    name: 'Mein Kontor',
    type: 'personal',
    currency: 'EUR',
    createdBy: uid,
    createdAt: now,
    settings: { language: 'de', firstDayOfWeek: 1 },
  }
  batch.set(wsRef, workspace)

  const member: WorkspaceMember = { uid, role: 'owner', displayName, joinedAt: now }
  batch.set(doc(db, 'workspaces', wsId, 'members', uid), member)

  const labelMe: Omit<LabelMember, 'id'> = { name: 'Ich', relation: 'Ich', isMe: true }
  batch.set(doc(collection(db, 'workspaces', wsId, 'labelMembers')), labelMe)

  const membership: Omit<UserWorkspaceMembership, never> = {
    workspaceId: wsId, role: 'owner', name: 'Mein Kontor', type: 'personal', joinedAt: now,
  }
  batch.set(doc(db, 'users', uid, 'workspaces', wsId), membership)

  for (const cat of DEFAULT_CATEGORIES) {
    batch.set(doc(collection(db, 'workspaces', wsId, 'categories')), cat)
  }
  for (const pm of DEFAULT_PAYMENT_METHODS) {
    batch.set(doc(collection(db, 'workspaces', wsId, 'paymentMethods')), pm)
  }

  await batch.commit()
  return wsId
}
