import { useEffect, useState, useCallback } from 'react'
import {
  collection, query, where, orderBy, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc, getDocs,
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { useWorkspace } from '../contexts/WorkspaceContext'
import { monthRange, yearRange } from '../lib/formatters'
import type {
  Transaction, Category, PaymentMethod, LabelMember, WorkspaceMember,
  RecurringTransaction, Budget, Template,
} from '../types'

function wsCol(wsId: string, name: string) {
  return collection(db, `workspaces/${wsId}/${name}`)
}
function wsDoc(wsId: string, col: string, id: string) {
  return doc(db, `workspaces/${wsId}/${col}/${id}`)
}

export function useCategories() {
  const { activeWorkspaceId } = useWorkspace()
  const [categories, setCategories] = useState<Category[]>([])
  useEffect(() => {
    if (!activeWorkspaceId) return
    const q = query(wsCol(activeWorkspaceId, 'categories'), orderBy('order'))
    return onSnapshot(q, snap => {
      setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() } as Category)))
    })
  }, [activeWorkspaceId])
  return categories
}

export function usePaymentMethods() {
  const { activeWorkspaceId } = useWorkspace()
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  useEffect(() => {
    if (!activeWorkspaceId) return
    return onSnapshot(wsCol(activeWorkspaceId, 'paymentMethods'), snap => {
      setMethods(snap.docs.map(d => ({ id: d.id, ...d.data() } as PaymentMethod)))
    })
  }, [activeWorkspaceId])
  return methods
}

export function useWorkspaceMembers() {
  const { activeWorkspaceId } = useWorkspace()
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  useEffect(() => {
    if (!activeWorkspaceId) return
    return onSnapshot(wsCol(activeWorkspaceId, 'members'), snap => {
      setMembers(snap.docs.map(d => ({ ...d.data(), uid: d.id } as WorkspaceMember)))
    })
  }, [activeWorkspaceId])
  return members
}

export function useLabelMembers() {
  const { activeWorkspaceId } = useWorkspace()
  const [members, setMembers] = useState<LabelMember[]>([])
  useEffect(() => {
    if (!activeWorkspaceId) return
    return onSnapshot(wsCol(activeWorkspaceId, 'labelMembers'), snap => {
      setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() } as LabelMember)))
    })
  }, [activeWorkspaceId])
  return members
}

export function useMonthTransactions(year: number, month: number) {
  const { activeWorkspaceId } = useWorkspace()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (!activeWorkspaceId) return
    const { start, end } = monthRange(year, month)
    const q = query(
      wsCol(activeWorkspaceId, 'transactions'),
      where('date', '>=', start),
      where('date', '<=', end),
      orderBy('date', 'desc'),
    )
    setLoading(true)
    return onSnapshot(q, snap => {
      setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)))
      setLoading(false)
    })
  }, [activeWorkspaceId, year, month])
  return { transactions, loading }
}

export function useYearTransactions(year: number) {
  const { activeWorkspaceId } = useWorkspace()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (!activeWorkspaceId) return
    const { start, end } = yearRange(year)
    const q = query(
      wsCol(activeWorkspaceId, 'transactions'),
      where('date', '>=', start),
      where('date', '<=', end),
      orderBy('date', 'desc'),
    )
    setLoading(true)
    return onSnapshot(q, snap => {
      setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)))
      setLoading(false)
    })
  }, [activeWorkspaceId, year])
  return { transactions, loading }
}

export function useRecurringTransactions() {
  const { activeWorkspaceId } = useWorkspace()
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([])
  useEffect(() => {
    if (!activeWorkspaceId) return
    return onSnapshot(wsCol(activeWorkspaceId, 'recurringTransactions'), snap => {
      setRecurring(snap.docs.map(d => ({ id: d.id, ...d.data() } as RecurringTransaction)))
    })
  }, [activeWorkspaceId])
  return recurring
}

export function useBudgets() {
  const { activeWorkspaceId } = useWorkspace()
  const [budgets, setBudgets] = useState<Budget[]>([])
  useEffect(() => {
    if (!activeWorkspaceId) return
    return onSnapshot(wsCol(activeWorkspaceId, 'budgets'), snap => {
      setBudgets(snap.docs.map(d => ({ id: d.id, ...d.data() } as Budget)))
    })
  }, [activeWorkspaceId])
  return budgets
}

export function useTemplates() {
  const { activeWorkspaceId } = useWorkspace()
  const [templates, setTemplates] = useState<Template[]>([])
  useEffect(() => {
    if (!activeWorkspaceId) return
    return onSnapshot(wsCol(activeWorkspaceId, 'templates'), snap => {
      setTemplates(snap.docs.map(d => ({ id: d.id, ...d.data() } as Template)))
    })
  }, [activeWorkspaceId])
  return templates
}

export function useLabelMemberActions() {
  const { activeWorkspaceId } = useWorkspace()

  const addLabelMember = useCallback(async (data: Omit<LabelMember, 'id'>) => {
    if (!activeWorkspaceId) return
    await addDoc(wsCol(activeWorkspaceId, 'labelMembers'), data)
  }, [activeWorkspaceId])

  const deleteLabelMember = useCallback(async (id: string) => {
    if (!activeWorkspaceId) return
    await deleteDoc(wsDoc(activeWorkspaceId, 'labelMembers', id))
  }, [activeWorkspaceId])

  return { addLabelMember, deleteLabelMember }
}

export function useTransactionActions() {
  const { activeWorkspaceId } = useWorkspace()

  const addTransaction = useCallback(async (data: Omit<Transaction, 'id'>) => {
    if (!activeWorkspaceId) return
    await addDoc(wsCol(activeWorkspaceId, 'transactions'), data)
  }, [activeWorkspaceId])

  const deleteTransaction = useCallback(async (id: string) => {
    if (!activeWorkspaceId) return
    await deleteDoc(wsDoc(activeWorkspaceId, 'transactions', id))
  }, [activeWorkspaceId])

  const updateTransaction = useCallback(async (id: string, data: Record<string, unknown>) => {
    if (!activeWorkspaceId) return
    await updateDoc(wsDoc(activeWorkspaceId, 'transactions', id), data)
  }, [activeWorkspaceId])

  return { addTransaction, deleteTransaction, updateTransaction }
}

export function useCategoryActions() {
  const { activeWorkspaceId } = useWorkspace()

  const addCategory = useCallback(async (data: Omit<Category, 'id'>) => {
    if (!activeWorkspaceId) return
    await addDoc(wsCol(activeWorkspaceId, 'categories'), data)
  }, [activeWorkspaceId])

  const updateCategory = useCallback(async (id: string, data: Partial<Category>) => {
    if (!activeWorkspaceId) return
    await updateDoc(wsDoc(activeWorkspaceId, 'categories', id), data as Record<string, unknown>)
  }, [activeWorkspaceId])

  const deleteCategory = useCallback(async (id: string) => {
    if (!activeWorkspaceId) return
    await deleteDoc(wsDoc(activeWorkspaceId, 'categories', id))
  }, [activeWorkspaceId])

  return { addCategory, updateCategory, deleteCategory }
}

export function usePaymentMethodActions() {
  const { activeWorkspaceId } = useWorkspace()

  const addPaymentMethod = useCallback(async (data: Omit<PaymentMethod, 'id'>) => {
    if (!activeWorkspaceId) return
    await addDoc(wsCol(activeWorkspaceId, 'paymentMethods'), data)
  }, [activeWorkspaceId])

  const deletePaymentMethod = useCallback(async (id: string) => {
    if (!activeWorkspaceId) return
    await deleteDoc(wsDoc(activeWorkspaceId, 'paymentMethods', id))
  }, [activeWorkspaceId])

  return { addPaymentMethod, deletePaymentMethod }
}

export function useBudgetActions() {
  const { activeWorkspaceId } = useWorkspace()

  const setBudget = useCallback(async (categoryId: string, amount: number) => {
    if (!activeWorkspaceId) return
    const col = wsCol(activeWorkspaceId, 'budgets')
    const q = query(col, where('categoryId', '==', categoryId))
    const snap = await getDocs(q)
    if (snap.empty) {
      await addDoc(col, { categoryId, amount })
    } else {
      await updateDoc(snap.docs[0].ref, { amount })
    }
  }, [activeWorkspaceId])

  const deleteBudget = useCallback(async (id: string) => {
    if (!activeWorkspaceId) return
    await deleteDoc(wsDoc(activeWorkspaceId, 'budgets', id))
  }, [activeWorkspaceId])

  return { setBudget, deleteBudget }
}

export function useRecurringActions() {
  const { activeWorkspaceId } = useWorkspace()

  const addRecurring = useCallback(async (data: Omit<RecurringTransaction, 'id'>) => {
    if (!activeWorkspaceId) return
    await addDoc(wsCol(activeWorkspaceId, 'recurringTransactions'), data)
  }, [activeWorkspaceId])

  const updateRecurring = useCallback(async (id: string, data: Partial<RecurringTransaction>) => {
    if (!activeWorkspaceId) return
    await updateDoc(wsDoc(activeWorkspaceId, 'recurringTransactions', id), data as Record<string, unknown>)
  }, [activeWorkspaceId])

  const deleteRecurring = useCallback(async (id: string) => {
    if (!activeWorkspaceId) return
    await deleteDoc(wsDoc(activeWorkspaceId, 'recurringTransactions', id))
  }, [activeWorkspaceId])

  return { addRecurring, updateRecurring, deleteRecurring }
}

export function useTemplateActions() {
  const { activeWorkspaceId } = useWorkspace()

  const addTemplate = useCallback(async (data: Omit<Template, 'id'>) => {
    if (!activeWorkspaceId) return
    await addDoc(wsCol(activeWorkspaceId, 'templates'), data)
  }, [activeWorkspaceId])

  const deleteTemplate = useCallback(async (id: string) => {
    if (!activeWorkspaceId) return
    await deleteDoc(wsDoc(activeWorkspaceId, 'templates', id))
  }, [activeWorkspaceId])

  return { addTemplate, deleteTemplate }
}
