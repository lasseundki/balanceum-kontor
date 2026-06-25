import { addDays, addWeeks, addMonths, addYears, startOfDay } from 'date-fns'
import { collection, doc, writeBatch } from 'firebase/firestore'
import { db } from '../firebase/config'
import type { RecurringTransaction, Frequency } from '../types'

function occurrences(rt: RecurringTransaction, fromTs: number, upToTs: number): number[] {
  const dates: number[] = []
  let cur = startOfDay(new Date(rt.startDate))
  const from = startOfDay(new Date(fromTs))
  const end = startOfDay(new Date(upToTs))

  while (cur <= end) {
    if (cur >= from) dates.push(cur.getTime())
    switch (rt.frequency as Frequency) {
      case 'daily':   cur = addDays(cur, 1);   break
      case 'weekly':  cur = addWeeks(cur, 1);  break
      case 'monthly': cur = addMonths(cur, 1); break
      case 'yearly':  cur = addYears(cur, 1);  break
    }
  }
  return dates
}

export async function generateRecurringTransactions(
  wsId: string,
  recurring: RecurringTransaction[],
): Promise<void> {
  const today = startOfDay(new Date()).getTime()

  for (const rt of recurring) {
    const from = rt.lastGeneratedDate
      ? addDays(new Date(rt.lastGeneratedDate), 1).getTime()
      : rt.startDate

    if (from > today) continue

    const dates = occurrences(rt, from, today)
    if (dates.length === 0) continue

    const batch = writeBatch(db)
    const txCol = collection(db, `workspaces/${wsId}/transactions`)

    for (const date of dates) {
      const txRef = doc(txCol)
      batch.set(txRef, {
        type: rt.type,
        amount: rt.amount,
        date,
        categoryId: rt.categoryId,
        ...(rt.paymentMethodId ? { paymentMethodId: rt.paymentMethodId } : {}),
        ...(rt.forMembers    ? { forMembers: rt.forMembers }             : {}),
        ...(rt.note          ? { note: rt.note }                         : {}),
        isGift: rt.isGift,
        isExtraordinary: rt.isExtraordinary,
        createdAt: Date.now(),
        createdBy: rt.createdBy,
        recurringId: rt.id,
      })
    }

    const rtRef = doc(db, `workspaces/${wsId}/recurringTransactions/${rt.id}`)
    batch.update(rtRef, { lastGeneratedDate: today })

    await batch.commit()
  }
}
