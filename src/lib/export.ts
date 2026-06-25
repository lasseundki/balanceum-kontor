import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase/config'
import { format } from 'date-fns'
import type { Category, PaymentMethod } from '../types'

export async function exportTransactionsCsv(
  wsId: string,
  categories: Category[],
  paymentMethods: PaymentMethod[],
  baseCurrency: string,
): Promise<void> {
  const snap = await getDocs(
    query(collection(db, `workspaces/${wsId}/transactions`), orderBy('date', 'desc')),
  )

  const catMap = Object.fromEntries(categories.map(c => [c.id, c]))
  const pmMap = Object.fromEntries(paymentMethods.map(pm => [pm.id, pm]))

  const headers = [
    'Datum', 'Typ', 'Betrag', 'Währung', 'Wechselkurs',
    `Betrag (${baseCurrency})`, 'Kategorie', 'Notiz', 'Zahlungsmethode',
    'Fixkosten', 'Außergewöhnlich', 'Geschenk',
  ]

  const rows = snap.docs.map(d => {
    const tx = d.data()
    const sign = tx.type === 'expense' ? '-' : '+'
    const effective = tx.amountInBase ?? tx.amount
    return [
      format(new Date(tx.date), 'dd.MM.yyyy'),
      tx.type === 'expense' ? 'Ausgabe' : 'Einnahme',
      `${sign}${(tx.amount as number).toFixed(2)}`,
      tx.currency ?? baseCurrency,
      tx.exchangeRate ? (tx.exchangeRate as number).toFixed(4) : '',
      `${sign}${(effective as number).toFixed(2)}`,
      catMap[tx.categoryId]?.name ?? '',
      tx.note ?? '',
      pmMap[tx.paymentMethodId]?.name ?? '',
      tx.isFixed ? 'Ja' : 'Nein',
      tx.isExtraordinary ? 'Ja' : 'Nein',
      tx.isGift ? 'Ja' : 'Nein',
    ]
  })

  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `kontor-export-${format(new Date(), 'yyyy-MM-dd')}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
