import { useState } from 'react'
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { useWorkspace } from '../contexts/WorkspaceContext'
import { useMonthTransactions, useCategories, useTemplates, useBudgets } from '../hooks/useWorkspaceFirestore'
import { fmt, fmtShort, fmtMonthYear, fmtDateShort } from '../lib/formatters'
import AddTransactionModal from '../components/modals/AddTransactionModal'
import type { Template } from '../types'

export default function Dashboard() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { activeWorkspace } = useWorkspace()
  const currency = activeWorkspace?.currency ?? 'EUR'

  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  const { transactions, loading } = useMonthTransactions(year, month)
  const categories = useCategories()
  const templates = useTemplates()
  const budgets = useBudgets()

  const [catView, setCatView] = useState<'compare' | 'budget'>('compare')
  const [templateModal, setTemplateModal] = useState<Template | null>(null)

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  const income  = transactions.filter(t => t.type === 'income').reduce((s, t) => s + (t.amountInBase ?? t.amount), 0)
  const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + (t.amountInBase ?? t.amount), 0)
  const balance = income - expense

  const catMap     = Object.fromEntries(categories.map(c => [c.id, c]))
  const budgetMap  = Object.fromEntries(budgets.map(b => [b.categoryId, b.amount]))

  const catTotals = transactions
    .filter(t => t.type === 'expense')
    .reduce<Record<string, number>>((acc, t) => {
      acc[t.categoryId] = (acc[t.categoryId] ?? 0) + (t.amountInBase ?? t.amount)
      return acc
    }, {})

  const topCats = Object.entries(catTotals).sort(([, a], [, b]) => b - a).slice(0, 5)
  const budgetWarning = topCats.some(([catId, total]) => {
    const budget = budgetMap[catId]
    return budget && (total / budget) >= 0.8
  })
  const extraordinary = transactions.filter(t => t.isExtraordinary)
  const extraordinaryTotal = extraordinary.reduce((s, t) => s + (t.amountInBase ?? t.amount), 0)

  const recent = transactions.slice(0, 12)
  const displayName = user?.displayName?.split(' ')[0] ?? ''

  return (
    <div className="px-4 pt-4 space-y-4">
      {/* Greeting */}
      <div>
        <p className="text-xs text-text-muted uppercase tracking-wide font-semibold">{t('dashboard.welcomeBack')}</p>
        <h1 className="font-heading text-2xl font-bold text-text">{displayName}</h1>
      </div>

      {/* Month Nav + Balance Card */}
      <div className="bg-accent rounded-xl p-5 text-text-inverse shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="p-1 rounded-md hover:bg-white/20 transition-colors">
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm font-medium opacity-90">{fmtMonthYear(year, month)}</span>
          <button onClick={nextMonth} className="p-1 rounded-md hover:bg-white/20 transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>

        <p className="text-xs opacity-75 uppercase tracking-wider mb-1">{t('common.balance')}</p>
        <p className={`font-heading text-4xl font-bold ${balance < 0 ? 'text-error-light' : ''}`}>
          {loading ? '…' : fmt(balance, currency)}
        </p>

        <div className="flex gap-6 mt-4 pt-4 border-t border-white/20">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="opacity-80" />
            <div>
              <p className="text-xs opacity-70">{t('common.income')}</p>
              <p className="text-sm font-semibold">{fmtShort(income, currency)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TrendingDown size={16} className="opacity-80" />
            <div>
              <p className="text-xs opacity-70">{t('common.expense')}</p>
              <p className="text-sm font-semibold">{fmtShort(expense, currency)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick-entry templates */}
      {templates.length > 0 && (
        <div className="bg-surface border border-border rounded-xl p-4">
          <h2 className="font-heading text-sm font-semibold text-text mb-3">{t('dashboard.quickEntry')}</h2>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {templates.map(tmpl => {
              const cat = catMap[tmpl.categoryId]
              return (
                <button key={tmpl.id} onClick={() => setTemplateModal(tmpl)}
                  className="flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2.5 bg-bg-subtle border border-border rounded-xl hover:bg-accent-light hover:border-accent transition-colors min-w-[80px]">
                  <span className="text-xl">{cat?.icon ?? '📌'}</span>
                  <span className="text-xs font-medium text-text text-center leading-tight">{tmpl.name}</span>
                  <span className="text-xs text-text-muted">{fmt(tmpl.amount, currency)}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Extraordinary alert */}
      {extraordinary.length > 0 && (
        <div className="flex items-center gap-3 bg-warning-light border border-warning rounded-lg p-3">
          <AlertTriangle size={18} className="text-warning flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-text">{t('dashboard.extraordinaryAlert')}</p>
            <p className="text-xs text-text-secondary">{fmt(extraordinaryTotal, currency)} {t('dashboard.extraordinaryMonth')}</p>
          </div>
        </div>
      )}

      {/* Top categories */}
      {topCats.length > 0 && (
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading text-base font-semibold text-text">{t('dashboard.topExpenses')}</h2>
            <button onClick={() => setCatView(v => v === 'compare' ? 'budget' : 'compare')}
              className="relative text-xs text-text-muted hover:text-accent transition-colors px-2 py-1 rounded-md hover:bg-bg-subtle">
              {catView === 'compare' ? t('dashboard.budgetView') : t('dashboard.compareView')}
              {catView === 'compare' && budgetWarning && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-warning" />
              )}
            </button>
          </div>
          <div className="space-y-3">
            {topCats.map(([catId, total]) => {
              const cat = catMap[catId]
              const budget = budgetMap[catId]
              const pct = catView === 'compare'
                ? expense > 0 ? (total / expense) * 100 : 0
                : budget ? Math.min((total / budget) * 100, 100) : expense > 0 ? (total / expense) * 100 : 0
              const barColor = catView === 'budget' && budget
                ? pct >= 100 ? '#B87B72' : pct >= 80 ? '#C9A05A' : '#7BA89B'
                : '#7BA89B'
              return (
                <div key={catId}>
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2">
                      <span>{cat?.icon ?? '📌'}</span>
                      <span className="text-sm font-medium text-text">{cat?.name ?? '?'}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-text">{fmt(total, currency)}</span>
                      {catView === 'budget' && budget && (
                        <span className="text-xs text-text-muted ml-1">/ {fmt(budget, currency)}</span>
                      )}
                      {catView === 'compare' && (
                        <span className="text-xs text-text-muted ml-1">{pct.toFixed(0)}%</span>
                      )}
                    </div>
                  </div>
                  <div className="h-1.5 bg-bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(pct, 100)}%`, background: barColor }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent transactions */}
      {recent.length > 0 && (
        <div className="bg-surface border border-border rounded-xl p-4">
          <h2 className="font-heading text-base font-semibold text-text mb-3">{t('dashboard.recentBookings')}</h2>
          <div className="space-y-0">
            {recent.map((tx, i) => {
              const cat = catMap[tx.categoryId]
              const amount = tx.amountInBase ?? tx.amount
              return (
                <div key={tx.id}>
                  {i > 0 && <div className="h-px bg-border my-2" />}
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{cat?.icon ?? '📌'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text truncate">
                        {tx.note || cat?.name || t('transaction.unknown')}
                      </p>
                      <p className="text-xs text-text-muted">{fmtDateShort(tx.date)}</p>
                    </div>
                    <span className={`text-sm font-semibold tabular-nums ${tx.type === 'income' ? 'text-success' : 'text-error'}`}>
                      {tx.type === 'income' ? '+' : '−'}{fmt(amount, currency)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {templateModal && (
        <AddTransactionModal template={templateModal} onClose={() => setTemplateModal(null)} />
      )}

      {!loading && transactions.length === 0 && (
        <div className="text-center py-12 text-text-muted">
          <p className="text-4xl mb-3">💸</p>
          <p className="font-heading text-lg font-medium text-text-secondary">{t('dashboard.noBookings')}</p>
          <p className="text-sm mt-1">{t('dashboard.startHint')}</p>
        </div>
      )}
    </div>
  )
}
