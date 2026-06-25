import { useState, useEffect, useMemo } from 'react'
import { Search, X, ChevronDown } from 'lucide-react'
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { de, enUS, es } from 'date-fns/locale'
import { useWorkspace } from '../contexts/WorkspaceContext'
import { useCategories } from '../hooks/useWorkspaceFirestore'
import { fmt, fmtDateShort } from '../lib/formatters'
import TransactionDetailSheet from './modals/TransactionDetailSheet'
import type { Transaction } from '../types'

interface Props {
  onClose: () => void
}

async function fetchYear(wsId: string, year: number): Promise<Transaction[]> {
  const start = new Date(year, 0, 1).getTime()
  const end = new Date(year + 1, 0, 1).getTime()
  const snap = await getDocs(
    query(
      collection(db, `workspaces/${wsId}/transactions`),
      where('date', '>=', start),
      where('date', '<', end),
      orderBy('date', 'desc'),
    ),
  )
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction))
}

export default function SearchOverlay({ onClose }: Props) {
  const { t, i18n } = useTranslation()
  const { activeWorkspaceId, activeWorkspace } = useWorkspace()
  const categories = useCategories()
  const currency = activeWorkspace?.currency ?? 'EUR'

  const now = new Date()
  const currentYear = now.getFullYear()

  const [term, setTerm] = useState('')
  const [txs, setTxs] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [olderLoaded, setOlderLoaded] = useState(false)
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)

  const catMap = useMemo(() => Object.fromEntries(categories.map(c => [c.id, c])), [categories])
  const dateLocale = i18n.language === 'de' ? de : i18n.language === 'es' ? es : enUS

  useEffect(() => {
    if (!activeWorkspaceId) return
    setLoading(true)
    fetchYear(activeWorkspaceId, currentYear)
      .then(data => setTxs(data))
      .finally(() => setLoading(false))
  }, [activeWorkspaceId, currentYear])

  async function loadOlder() {
    if (!activeWorkspaceId || olderLoaded) return
    setLoadingOlder(true)
    const older = await fetchYear(activeWorkspaceId, currentYear - 1)
    setTxs(prev => [...prev, ...older])
    setOlderLoaded(true)
    setLoadingOlder(false)
  }

  const results = useMemo(() => {
    const q = term.trim().toLowerCase()
    if (q.length < 2) return []
    return txs.filter(tx => {
      const cat = catMap[tx.categoryId]
      return (
        (tx.note ?? '').toLowerCase().includes(q) ||
        (cat?.name ?? '').toLowerCase().includes(q) ||
        String(tx.amount).includes(q)
      )
    })
  }, [term, txs, catMap])

  const grouped = useMemo(() => {
    const groups: { label: string; items: Transaction[] }[] = []
    let currentLabel: string | null = null
    let current: Transaction[] = []
    for (const tx of results) {
      const label = format(new Date(tx.date), 'LLLL yyyy', { locale: dateLocale })
      if (label !== currentLabel) {
        if (currentLabel !== null) groups.push({ label: currentLabel, items: current })
        currentLabel = label
        current = [tx]
      } else {
        current.push(tx)
      }
    }
    if (currentLabel !== null) groups.push({ label: currentLabel, items: current })
    return groups
  }, [results, dateLocale])

  return (
    <>
      <div className="fixed inset-0 z-50 bg-bg-subtle flex flex-col max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 bg-surface border-b border-border safe-top">
          <div className="flex-1 flex items-center gap-2 bg-bg-subtle rounded-xl px-3 py-2.5">
            <Search size={15} className="text-text-muted flex-shrink-0" />
            <input
              autoFocus
              value={term}
              onChange={e => setTerm(e.target.value)}
              placeholder={t('search.placeholder')}
              className="flex-1 bg-transparent text-sm text-text placeholder-text-muted focus:outline-none"
            />
            {term && (
              <button onClick={() => setTerm('')} className="text-text-muted hover:text-text">
                <X size={14} />
              </button>
            )}
          </div>
          <button onClick={onClose} className="text-sm font-medium text-accent flex-shrink-0">
            {t('common.cancel')}
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="text-center py-16 text-text-muted text-sm">{t('common.loading')}</div>
          ) : term.length < 2 ? (
            <div className="text-center py-16 text-text-muted px-6">
              <p className="text-4xl mb-3">🔍</p>
              <p className="text-sm font-medium text-text-secondary">{t('search.hint')}</p>
              <p className="text-xs mt-2 text-text-muted">
                {currentYear} · {txs.length} {t('search.txCount')}
                {olderLoaded && ` + ${currentYear - 1}`}
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-16 text-text-muted px-6">
              <p className="text-4xl mb-3">🤷</p>
              <p className="text-sm">{t('search.noResults')}</p>
            </div>
          ) : (
            <div className="pb-8">
              <p className="px-4 py-3 text-xs text-text-muted">
                {results.length} {t('search.results')}
              </p>
              {grouped.map(group => (
                <div key={group.label}>
                  <p className="px-4 py-2 text-xs font-semibold text-text-muted uppercase tracking-wide bg-bg-subtle border-y border-border sticky top-0 z-10">
                    {group.label}
                  </p>
                  <div className="bg-surface">
                    {group.items.map((tx, i) => {
                      const cat = catMap[tx.categoryId]
                      const amount = tx.amountInBase ?? tx.amount
                      return (
                        <div key={tx.id}>
                          {i > 0 && <div className="h-px bg-border mx-4" />}
                          <button
                            onClick={() => setSelectedTx(tx)}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-bg-subtle transition-colors"
                          >
                            <span className="text-xl flex-shrink-0">{cat?.icon ?? '📌'}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-text truncate">{tx.note || cat?.name || '?'}</p>
                              <p className="text-xs text-text-muted">{fmtDateShort(tx.date)}</p>
                            </div>
                            <span className={`text-sm font-semibold flex-shrink-0 ${tx.type === 'income' ? 'text-success' : 'text-error'}`}>
                              {tx.type === 'income' ? '+' : '−'}{fmt(amount, currency)}
                            </span>
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}

              {!olderLoaded && (
                <button
                  onClick={loadOlder}
                  disabled={loadingOlder}
                  className="w-full flex items-center justify-center gap-2 py-5 text-sm text-text-secondary hover:text-accent transition-colors disabled:opacity-50"
                >
                  {loadingOlder
                    ? t('common.loading')
                    : <><ChevronDown size={15} /> {t('search.loadOlder')} {currentYear - 1}</>
                  }
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {selectedTx && (
        <TransactionDetailSheet tx={selectedTx} onClose={() => setSelectedTx(null)} />
      )}
    </>
  )
}
