import { useState, useEffect, useRef } from 'react'
import { X, Star, Zap, ChevronDown, AlertCircle, Users } from 'lucide-react'
import { format } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import {
  useCategories, usePaymentMethods, useLabelMembers,
  useWorkspaceMembers, useTransactionActions,
} from '../../hooks/useWorkspaceFirestore'
import { CURRENCIES, fetchExchangeRate } from '../../lib/currency'
import { fmtCurrency } from '../../lib/formatters'
import { saveNoteToHistory, getNoteHistory } from '../../lib/noteHistory'
import type { TransactionType, TransactionParticipants, MemberRefType, Template, Transaction } from '../../types'

interface Props {
  onClose: () => void
  template?: Template
  editTx?: Transaction
}

function formatAmountInput(raw: string): string {
  const stripped = raw.replace(/\./g, '')
  const onlyValid = stripped.replace(/[^\d,]/g, '')
  const parts = onlyValid.split(',')
  const intPart = (parts[0] || '').replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return parts.length > 1 ? `${intPart},${parts[1]}` : intPart
}

function numToGermanAmount(n: number): string {
  return n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function AddTransactionModal({ onClose, template, editTx }: Props) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { activeWorkspace } = useWorkspace()
  const baseCurrency = activeWorkspace?.currency ?? 'EUR'
  const isSharedWorkspace = activeWorkspace?.type !== 'personal'

  const categories      = useCategories()
  const paymentMethods  = usePaymentMethods()
  const labelMembers    = useLabelMembers()
  const wsMembers       = useWorkspaceMembers()
  const { addTransaction, updateTransaction } = useTransactionActions()

  const [type, setType]             = useState<TransactionType>(editTx?.type ?? template?.type ?? 'expense')
  const [amount, setAmount]         = useState(() => {
    if (editTx) return numToGermanAmount(editTx.amount)
    if (template) return String(template.amount).replace('.', ',')
    return ''
  })
  const [date, setDate]             = useState(() => {
    if (editTx) return format(new Date(editTx.date), 'yyyy-MM-dd')
    return format(new Date(), 'yyyy-MM-dd')
  })
  const [categoryId, setCategoryId] = useState(editTx?.categoryId ?? template?.categoryId ?? '')
  const [paymentMethodId, setPaymentMethodId] = useState(editTx?.paymentMethodId ?? template?.paymentMethodId ?? '')
  const [forMembers, setForMembers] = useState<TransactionParticipants | undefined>(
    editTx?.forMembers ?? undefined
  )
  const [note, setNote]             = useState(editTx?.note ?? template?.note ?? '')
  const [noteSuggestions, setNoteSuggestions] = useState<string[]>([])
  const [isGift, setIsGift]                     = useState(editTx?.isGift ?? template?.isGift ?? false)
  const [isExtraordinary, setIsExtraordinary]   = useState(editTx?.isExtraordinary ?? template?.isExtraordinary ?? false)
  const [saving, setSaving]         = useState(false)

  // Currency
  const [currency, setCurrency]           = useState(editTx?.currency ?? baseCurrency)
  const [exchangeRate, setExchangeRate]   = useState(editTx?.exchangeRate ?? 1)
  const [rateLoading, setRateLoading]     = useState(false)
  const [rateError, setRateError]         = useState(false)
  const [manualRate, setManualRate]       = useState('')
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false)
  const rateAbort = useRef<AbortController | null>(null)

  const isForeign    = currency !== baseCurrency
  const parsedAmount = parseFloat(amount.replace(/\./g, '').replace(',', '.')) || 0
  const effectiveRate = rateError && manualRate ? parseFloat(manualRate.replace(',', '.')) : exchangeRate
  const amountInBase  = isForeign ? parsedAmount * effectiveRate : parsedAmount

  useEffect(() => {
    if (!isForeign) { setExchangeRate(1); setRateError(false); return }
    setRateLoading(true); setRateError(false)
    rateAbort.current?.abort()
    rateAbort.current = new AbortController()
    fetchExchangeRate(currency, baseCurrency)
      .then(r => { setExchangeRate(r); setRateLoading(false) })
      .catch(() => { setRateError(true); setRateLoading(false) })
  }, [currency, baseCurrency, isForeign])

  const filteredCats = categories.filter(c => c.type === type || c.type === 'both')

  // forMembers helpers
  function toggleMember(id: string, refType: MemberRefType) {
    setForMembers(prev => {
      if (prev === 'all') return [{ id, refType }]
      if (!prev) return [{ id, refType }]
      const arr = prev as Array<{ id: string; refType: MemberRefType }>
      const exists = arr.some(m => m.id === id)
      const next = exists ? arr.filter(m => m.id !== id) : [...arr, { id, refType }]
      return next.length === 0 ? undefined : next
    })
  }
  function toggleAll() {
    setForMembers(prev => prev === 'all' ? undefined : 'all')
  }
  function isMemberSelected(id: string) {
    if (forMembers === 'all') return false
    if (!forMembers) return false
    return (forMembers as Array<{ id: string }>).some(m => m.id === id)
  }

  async function handleSave() {
    if (!parsedAmount || parsedAmount <= 0 || !categoryId) return
    if (isForeign && rateError && !manualRate) return
    setSaving(true)
    if (note.trim()) saveNoteToHistory(note.trim())
    const [y, m, d] = date.split('-').map(Number)
    const txData = {
      type,
      amount: parsedAmount,
      currency: isForeign ? currency : undefined,
      exchangeRate: isForeign ? effectiveRate : undefined,
      amountInBase: isForeign ? amountInBase : undefined,
      date: new Date(y, m - 1, d).getTime(),
      categoryId,
      paymentMethodId: paymentMethodId || undefined,
      forMembers: forMembers ?? undefined,
      note: note.trim() || undefined,
      isGift,
      isExtraordinary,
    }
    if (editTx) {
      await updateTransaction(editTx.id, txData)
    } else {
      await addTransaction({ ...txData, createdAt: Date.now(), createdBy: user?.uid ?? '' })
    }
    onClose()
  }

  const canSave = parsedAmount > 0 && !!categoryId && !(isForeign && rateError && !manualRate)

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full bg-surface rounded-t-xl shadow-xl max-h-[92vh] overflow-y-auto max-w-lg mx-auto">

        {/* Header */}
        <div className="sticky top-0 bg-surface border-b border-border px-4 py-3 flex items-center justify-between z-10">
          <h2 className="font-heading text-lg font-semibold text-text">
            {editTx ? t('transaction.editTitle') : t('transaction.title')}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-md text-text-muted hover:bg-bg-muted transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4 pb-8">
          {/* Type Toggle */}
          <div className="flex bg-bg-muted rounded-lg p-1 gap-1">
            {(['expense', 'income'] as TransactionType[]).map(tx => (
              <button key={tx} onClick={() => { setType(tx); setCategoryId('') }}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                  type === tx ? 'bg-surface text-text shadow-sm' : 'text-text-secondary'
                }`}>
                {tx === 'expense' ? t('common.expense') : t('common.income')}
              </button>
            ))}
          </div>

          {/* Amount + Currency */}
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">{t('common.amount')}</label>
            <div className="flex gap-2">
              <input
                type="text" inputMode="decimal" value={amount} autoFocus
                onChange={e => setAmount(formatAmountInput(e.target.value))}
                placeholder="0,00"
                className="flex-1 border border-border rounded-md px-3 py-2.5 text-2xl font-bold text-text bg-surface focus:outline-none focus:border-accent focus:ring-3 focus:ring-accent-light"
              />
              <button onClick={() => setShowCurrencyPicker(true)}
                className="flex items-center gap-1.5 px-3 py-2.5 border border-border rounded-md text-sm font-semibold text-text bg-surface hover:bg-bg-subtle transition-colors min-w-[80px] justify-between">
                <span>{currency}</span>
                <ChevronDown size={14} className="text-text-muted" />
              </button>
            </div>

            {isForeign && (
              <div className="mt-2 px-3 py-2 bg-info-light rounded-md text-xs space-y-1">
                {rateLoading && <p className="text-text-secondary">{t('currency.loading')}</p>}
                {!rateLoading && !rateError && (
                  <>
                    <p className="text-text-secondary">
                      1 {currency} = {exchangeRate.toFixed(4)} {baseCurrency}
                    </p>
                    {parsedAmount > 0 && (
                      <p className="font-semibold text-text">= {fmtCurrency(amountInBase, baseCurrency)}</p>
                    )}
                  </>
                )}
                {!rateLoading && rateError && (
                  <>
                    <div className="flex items-center gap-1.5 text-error">
                      <AlertCircle size={12} /><span>{t('currency.error')}</span>
                    </div>
                    <input type="number" value={manualRate} onChange={e => setManualRate(e.target.value)}
                      placeholder={t('currency.manualRate')}
                      className="w-full border border-border rounded px-2 py-1 text-xs text-text bg-surface focus:outline-none focus:border-accent" />
                    {manualRate && parsedAmount > 0 && (
                      <p className="font-semibold text-text">= {fmtCurrency(amountInBase, baseCurrency)}</p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">{t('common.date')}</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full border border-border rounded-md px-3 py-2.5 text-sm text-text bg-surface focus:outline-none focus:border-accent focus:ring-3 focus:ring-accent-light" />
          </div>

          {/* Categories */}
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">{t('common.category')}</label>
            <div className="grid grid-cols-4 gap-2">
              {filteredCats.map(cat => (
                <button key={cat.id} onClick={() => setCategoryId(cat.id)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs font-medium transition-colors ${
                    categoryId === cat.id
                      ? 'border-accent bg-accent-light text-accent-dark'
                      : 'border-border bg-surface text-text-secondary hover:bg-bg-subtle'
                  }`}>
                  <span className="text-xl">{cat.icon}</span>
                  <span className="truncate w-full text-center">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method */}
          {paymentMethods.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">{t('transaction.paymentMethod')}</label>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setPaymentMethodId('')}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    !paymentMethodId ? 'bg-accent text-text-inverse border-accent' : 'border-border text-text-secondary hover:bg-bg-subtle'
                  }`}>
                  {t('common.none')}
                </button>
                {paymentMethods.map(pm => (
                  <button key={pm.id} onClick={() => setPaymentMethodId(pm.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      paymentMethodId === pm.id ? 'bg-accent text-text-inverse border-accent' : 'border-border text-text-secondary hover:bg-bg-subtle'
                    }`}>
                    {pm.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* For whom — label members always shown, workspace members only in shared workspaces */}
          {(labelMembers.length > 1 || isSharedWorkspace) && (
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-text mb-1.5">
                <Users size={14} />
                {t('transaction.forWhom')}
              </label>
              <div className="flex flex-wrap gap-2">
                {/* "Alle" pill — only in shared workspaces */}
                {isSharedWorkspace && (
                  <button onClick={toggleAll}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      forMembers === 'all' ? 'bg-accent text-text-inverse border-accent' : 'border-border text-text-secondary hover:bg-bg-subtle'
                    }`}>
                    {t('common.all')}
                  </button>
                )}
                {/* Real workspace members */}
                {wsMembers.map(m => (
                  <button key={m.uid} onClick={() => toggleMember(m.uid, 'real')}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      isMemberSelected(m.uid) ? 'bg-accent text-text-inverse border-accent' : 'border-border text-text-secondary hover:bg-bg-subtle'
                    }`}>
                    {m.displayName}
                  </button>
                ))}
                {/* Label members */}
                {labelMembers.filter(m => !m.isMe).map(m => (
                  <button key={m.id} onClick={() => toggleMember(m.id, 'label')}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border border-dashed transition-colors ${
                      isMemberSelected(m.id) ? 'bg-accent text-text-inverse border-accent border-solid' : 'border-border text-text-secondary hover:bg-bg-subtle'
                    }`}>
                    {m.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Flags */}
          <div className="flex gap-3">
            <button onClick={() => setIsExtraordinary(!isExtraordinary)}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium border flex-1 justify-center transition-colors ${
                isExtraordinary ? 'bg-warning-light text-warning border-warning' : 'border-border text-text-secondary hover:bg-bg-subtle'
              }`}>
              <Zap size={14} />{t('transaction.extraordinary')}
            </button>
            <button onClick={() => setIsGift(!isGift)}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium border flex-1 justify-center transition-colors ${
                isGift ? 'bg-info-light text-info border-info' : 'border-border text-text-secondary hover:bg-bg-subtle'
              }`}>
              <Star size={14} />{t('transaction.gift')}
            </button>
          </div>

          {/* Note with autocomplete */}
          <div className="relative">
            <label className="block text-sm font-medium text-text mb-1.5">{t('common.note')}</label>
            <input type="text" value={note}
              onChange={e => {
                setNote(e.target.value)
                setNoteSuggestions(e.target.value.trim()
                  ? getNoteHistory().filter(n => n.toLowerCase().includes(e.target.value.toLowerCase())).slice(0, 5)
                  : [])
              }}
              onBlur={() => setTimeout(() => setNoteSuggestions([]), 150)}
              placeholder={t('transaction.notePlaceholder')}
              className="w-full border border-border rounded-md px-3 py-2.5 text-sm text-text bg-surface focus:outline-none focus:border-accent focus:ring-3 focus:ring-accent-light" />
            {noteSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-surface border border-border rounded-lg shadow-lg z-10 overflow-hidden">
                {noteSuggestions.map(s => (
                  <button key={s} type="button" onMouseDown={() => { setNote(s); setNoteSuggestions([]) }}
                    className="w-full text-left px-3 py-2.5 text-sm text-text hover:bg-bg-subtle transition-colors border-b border-border/50 last:border-0">
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Save */}
          <button onClick={handleSave} disabled={saving || !canSave}
            className="w-full bg-accent text-text-inverse py-3 rounded-lg font-semibold text-sm hover:bg-accent-hover transition-colors disabled:opacity-40">
            {saving ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </div>

      {/* Currency Picker Sheet */}
      {showCurrencyPicker && (
        <div className="absolute inset-0 z-10 flex items-end">
          <div className="absolute inset-0 bg-black/20" onClick={() => setShowCurrencyPicker(false)} />
          <div className="relative w-full bg-surface rounded-t-xl shadow-xl max-h-[70vh] flex flex-col max-w-lg mx-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
              <h3 className="font-heading text-base font-semibold text-text">{t('currency.select')}</h3>
              <button onClick={() => setShowCurrencyPicker(false)} className="p-1 text-text-muted"><X size={20} /></button>
            </div>
            <div className="overflow-y-auto flex-1">
              {CURRENCIES.map(c => (
                <button key={c.code}
                  onClick={() => { setCurrency(c.code); setManualRate(''); setShowCurrencyPicker(false) }}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-bg-subtle transition-colors border-b border-border/50 last:border-0 ${
                    currency === c.code ? 'bg-accent-light' : ''
                  }`}>
                  <span className="text-xl">{c.flag}</span>
                  <div className="flex-1 text-left">
                    <span className="text-sm font-medium text-text">{c.code}</span>
                    <span className="text-xs text-text-muted ml-2">{c.name}</span>
                  </div>
                  <span className="text-sm text-text-muted">{c.symbol}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
