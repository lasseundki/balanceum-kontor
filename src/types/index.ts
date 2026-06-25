// ─── Primitives ───────────────────────────────────────────────────────────────

export type WorkspaceType = 'personal' | 'family' | 'business'
export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer'
export type TransactionType = 'expense' | 'income'
export type Frequency = 'daily' | 'weekly' | 'monthly' | 'yearly'
export type PaymentType = 'cash' | 'card' | 'transfer' | 'other' | 'qr'
export type CategoryType = 'expense' | 'income' | 'both'
export type MemberRefType = 'real' | 'label'

// ─── User (users/{uid}) ───────────────────────────────────────────────────────

export interface UserProfile {
  displayName: string
  email: string
  avatarUrl?: string
  language: string       // 'de' | 'en' | 'es' | 'pt'
  currency: string       // ISO 4217, z.B. 'EUR', 'PYG'
  createdAt: number
}

// users/{uid}/workspaces/{workspaceId}
// Denormalisiert — damit die App beim Login sofort alle Workspaces kennt
// ohne jede workspaces-Collection zu scannen
export interface UserWorkspaceMembership {
  workspaceId: string
  role: WorkspaceRole
  name: string           // Workspace-Name (denorm.)
  type: WorkspaceType    // (denorm.)
  currency: string       // (denorm.)
  joinedAt: number
}

// ─── Workspace (workspaces/{workspaceId}) ─────────────────────────────────────

export interface WorkspaceSettings {
  language: string
  firstDayOfWeek: 0 | 1  // 0 = Sonntag, 1 = Montag
}

export interface Workspace {
  id: string
  name: string
  type: WorkspaceType
  currency: string       // ISO 4217
  createdBy: string      // uid
  createdAt: number
  settings: WorkspaceSettings
}

// workspaces/{wsId}/members/{uid}
// Nur für echte Firebase-Accounts — können sich einloggen und schreiben
export interface WorkspaceMember {
  uid: string
  role: WorkspaceRole
  displayName: string
  avatarUrl?: string
  joinedAt: number
}

// workspaces/{wsId}/labelMembers/{id}
// Kein Firebase-Account — nur ein Name für Zuordnung (z.B. Kind, Geschenk-Empfänger)
export interface LabelMember {
  id: string
  name: string
  relation: string
  isMe: boolean
}

// workspaces/{wsId}/invites/{id}
export interface WorkspaceInvite {
  id: string
  code: string           // 6-stellig, z.B. "A3X9K2" — Link: /#/join?code=A3X9K2
  role: WorkspaceRole
  createdBy: string      // uid
  createdAt: number
  expiresAt: number      // Unix ms, Standard: +24h
}

// ─── Finanzdaten (workspaces/{wsId}/...) ─────────────────────────────────────

export interface Category {
  id: string
  name: string
  icon: string
  color: string
  type: CategoryType
  order: number
}

export interface PaymentMethod {
  id: string
  name: string
  type: PaymentType
  subtype?: 'debit' | 'credit'
  bank?: string
  color: string
  billingDay?: number
  last4?: string
}

// forMembers bestimmt, für wen die Transaktion war:
//   undefined  → persönliche Buchung, keine Zuordnung
//   'all'      → gesamter Workspace (z.B. Haushaltseinkauf)
//   Array      → nur diese Mitglieder (mix aus real + label möglich)
export type TransactionParticipants =
  | 'all'
  | Array<{ id: string; refType: MemberRefType }>

export interface Transaction {
  id: string
  type: TransactionType
  amount: number
  currency?: string
  exchangeRate?: number
  amountInBase?: number
  date: number
  categoryId: string
  paymentMethodId?: string
  forMembers?: TransactionParticipants
  note?: string
  isGift: boolean
  isExtraordinary: boolean
  createdAt: number
  createdBy: string              // uid — wer hat diese Buchung erfasst
  recurringId?: string
  attachmentUrl?: string         // Foto-Beleg via Firebase Storage (zukünftig)
}

export interface RecurringTransaction {
  id: string
  type: TransactionType
  amount: number
  categoryId: string
  paymentMethodId?: string
  forMembers?: TransactionParticipants
  note?: string
  frequency: Frequency
  startDate: number              // kann in der Vergangenheit liegen
  lastGeneratedDate?: number     // bis hierher wurde generiert; nie in der Zukunft
  isGift: boolean
  isExtraordinary: boolean
  createdBy: string
}

export interface Budget {
  id: string
  categoryId: string
  amount: number
}

export interface Template {
  id: string
  name: string
  type: TransactionType
  amount: number
  categoryId: string
  paymentMethodId?: string
  forMembers?: TransactionParticipants
  note?: string
  isGift: boolean
  isExtraordinary: boolean
}
