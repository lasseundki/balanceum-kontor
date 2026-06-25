import { useState } from 'react'
import { LogOut, Plus, Trash2, Check, ChevronDown, ChevronUp, Download } from 'lucide-react'
import { format } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { updateProfile } from 'firebase/auth'
import { useAuth } from '../contexts/AuthContext'
import {
  useCategories, useCategoryActions,
  usePaymentMethods, usePaymentMethodActions,
  useRecurringTransactions, useRecurringActions,
  useBudgets, useBudgetActions,
  useTemplates, useTemplateActions,
  useLabelMembers, useLabelMemberActions,
} from '../hooks/useWorkspaceFirestore'
import { fmt } from '../lib/formatters'
import { exportTransactionsCsv } from '../lib/export'
import { useWorkspace } from '../contexts/WorkspaceContext'
import type { CategoryType, TransactionType, Frequency } from '../types'

const CAT_ICONS = [
  '🏠','🧹','🛋️','🔧','💡','🛁','🪴','🏡','🪟','🚿','🛒','🧺',
  '🍽️','☕','🍕','🍺','🥗','🍣','🥘','🧁','🍱','🥩','🫖','🛍️',
  '🚗','✈️','🚌','🚂','⛽','🛵','🚕','🚢','🛴','🚲','🚁','🅿️',
  '💊','🏥','🏋️','🧘','🦷','👓','❤️','🩺','🧬','💉','🩹','🧴',
  '🎉','🎵','🎮','🎬','🎭','📚','🎨','🏖️','🎸','🎲','⚽','🎤',
  '👕','👟','👜','💄','💍','⌚','🕶️','👗','🧣','🧥','🩴','👒',
  '💰','📈','💼','📊','🏦','💳','📋','🧾','💸','📉','🏢','📝',
  '💻','📱','🖥️','🎧','📷','🔌','🖨️','📡','🎙️','⌨️','🖱️','📺',
  '🎁','🐾','🌿','🎓','👶','🏫','🤝','🎊','🌺','🎀','🕯️','🎈',
  '📌','🌍','⭐','🔑','📦','🎯','💫','🌈','✉️','🔒','🗺️','⚡',
]

const LANGUAGES = [
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
]

function IconPicker({ selected, onSelect }: { selected: string; onSelect: (icon: string) => void }) {
  const [showAll, setShowAll] = useState(false)
  const icons = showAll ? CAT_ICONS : CAT_ICONS.slice(0, 16)
  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {icons.map(ic => (
          <button
            key={ic}
            onClick={() => onSelect(ic)}
            className={`text-xl p-1.5 rounded-md transition-colors ${selected === ic ? 'bg-accent-light ring-2 ring-accent' : 'hover:bg-bg-muted'}`}
          >
            {ic}
          </button>
        ))}
      </div>
      <button onClick={() => setShowAll(s => !s)} className="mt-2 flex items-center gap-1 text-xs text-accent font-medium">
        {showAll ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {showAll ? 'Weniger' : `Mehr (${CAT_ICONS.length - 16})`}
      </button>
    </div>
  )
}

const FREQUENCIES: Frequency[] = ['monthly', 'weekly', 'yearly', 'daily']

export default function Settings() {
  const { t, i18n } = useTranslation()
  const { user, logout } = useAuth()
  const { activeWorkspace, activeWorkspaceId } = useWorkspace()
  const baseCurrency = activeWorkspace?.currency ?? 'EUR'

  const categories = useCategories()
  const { addCategory, updateCategory, deleteCategory } = useCategoryActions()
  const paymentMethods = usePaymentMethods()
  const { addPaymentMethod, deletePaymentMethod } = usePaymentMethodActions()
  const recurring = useRecurringTransactions()
  const { addRecurring, deleteRecurring } = useRecurringActions()
  const budgets = useBudgets()
  const { setBudget, deleteBudget } = useBudgetActions()
  const templates = useTemplates()
  const { addTemplate, deleteTemplate } = useTemplateActions()
  const labelMembers = useLabelMembers()
  const { addLabelMember, deleteLabelMember } = useLabelMemberActions()

  // New category form
  const [showAddCat, setShowAddCat] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [newCatIcon, setNewCatIcon] = useState('📌')
  const [newCatType, setNewCatType] = useState<CategoryType>('expense')
  const [savingCat, setSavingCat] = useState(false)

  // Edit category
  const [editCatId, setEditCatId] = useState<string | null>(null)
  const [editCatName, setEditCatName] = useState('')
  const [editCatIcon, setEditCatIcon] = useState('📌')

  // New payment method
  const [showAddPm, setShowAddPm] = useState(false)
  const [newPmName, setNewPmName] = useState('')

  // Profile
  const [editName, setEditName] = useState(false)
  const [newDisplayName, setNewDisplayName] = useState(user?.displayName ?? '')
  const [savingName, setSavingName] = useState(false)

  async function handleSaveName() {
    if (!user || !newDisplayName.trim()) return
    setSavingName(true)
    await updateProfile(user, { displayName: newDisplayName.trim() })
    setSavingName(false)
    setEditName(false)
  }

  // Label members
  const [showAddLabel, setShowAddLabel] = useState(false)
  const [labelName, setLabelName] = useState('')
  const [labelRelation, setLabelRelation] = useState('')

  // Budgets
  const [budgetInputs, setBudgetInputs] = useState<Record<string, string>>({})
  const budgetMap = Object.fromEntries(budgets.map(b => [b.categoryId, b]))

  // Templates
  const [showAddTmpl, setShowAddTmpl] = useState(false)
  const [tmplName, setTmplName] = useState('')
  const [tmplType, setTmplType] = useState<TransactionType>('expense')
  const [tmplAmount, setTmplAmount] = useState('')
  const [tmplCatId, setTmplCatId] = useState('')
  const [savingTmpl, setSavingTmpl] = useState(false)

  // Export
  const [exporting, setExporting] = useState(false)

  async function handleExport() {
    if (!activeWorkspaceId) return
    setExporting(true)
    try {
      await exportTransactionsCsv(activeWorkspaceId, categories, paymentMethods, baseCurrency)
    } finally {
      setExporting(false)
    }
  }

  // Recurring
  const [showAddRec, setShowAddRec] = useState(false)
  const [recType, setRecType] = useState<TransactionType>('expense')
  const [recAmount, setRecAmount] = useState('')
  const [recCatId, setRecCatId] = useState('')
  const [recFreq, setRecFreq] = useState<Frequency>('monthly')
  const [recStart, setRecStart] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [recNote, setRecNote] = useState('')
  const [savingRec, setSavingRec] = useState(false)

  async function handleAddCategory() {
    if (!newCatName.trim()) return
    setSavingCat(true)
    await addCategory({ name: newCatName.trim(), icon: newCatIcon, color: '', type: newCatType, order: categories.length })
    setNewCatName(''); setNewCatIcon('📌'); setNewCatType('expense'); setShowAddCat(false)
    setSavingCat(false)
  }

  async function handleSaveEditCat() {
    if (!editCatId || !editCatName.trim()) return
    await updateCategory(editCatId, { name: editCatName.trim(), icon: editCatIcon })
    setEditCatId(null)
  }

  async function handleAddLabelMember() {
    if (!labelName.trim()) return
    await addLabelMember({ name: labelName.trim(), relation: labelRelation.trim(), isMe: false })
    setLabelName(''); setLabelRelation(''); setShowAddLabel(false)
  }

  async function handleSaveBudget(catId: string) {
    const val = parseFloat((budgetInputs[catId] ?? '').replace(',', '.'))
    if (!val || val <= 0) {
      const existing = budgetMap[catId]
      if (existing) await deleteBudget(existing.id)
    } else {
      await setBudget(catId, val)
    }
    setBudgetInputs(p => ({ ...p, [catId]: '' }))
  }

  async function handleAddTemplate() {
    const parsed = parseFloat(tmplAmount.replace(/\./g, '').replace(',', '.'))
    if (!tmplName.trim() || !parsed || !tmplCatId) return
    setSavingTmpl(true)
    await addTemplate({
      name: tmplName.trim(),
      type: tmplType,
      amount: parsed,
      categoryId: tmplCatId,
      isGift: false,
      isExtraordinary: false,
    })
    setTmplName(''); setTmplAmount(''); setTmplCatId('')
    setShowAddTmpl(false); setSavingTmpl(false)
  }

  async function handleAddRecurring() {
    const parsed = parseFloat(recAmount.replace(/\./g, '').replace(',', '.'))
    if (!parsed || !recCatId) return
    setSavingRec(true)
    const [y, m, d] = recStart.split('-').map(Number)
    await addRecurring({
      type: recType,
      amount: parsed,
      categoryId: recCatId,
      frequency: recFreq,
      startDate: new Date(y, m - 1, d).getTime(),
      note: recNote.trim() || undefined,
      isGift: false,
      isExtraordinary: false,
      createdBy: user?.uid ?? '',
    })
    setRecAmount(''); setRecCatId(''); setRecNote('')
    setRecFreq('monthly'); setRecStart(format(new Date(), 'yyyy-MM-dd'))
    setShowAddRec(false); setSavingRec(false)
  }

  async function handleAddPaymentMethod() {
    if (!newPmName.trim()) return
    await addPaymentMethod({ name: newPmName.trim(), type: 'other', color: '' })
    setNewPmName(''); setShowAddPm(false)
  }

  const catTypeLabel = (type: CategoryType) => {
    if (type === 'expense') return t('settings.catTypeExpense')
    if (type === 'income') return t('settings.catTypeIncome')
    return t('settings.catTypeBoth')
  }

  return (
    <div className="px-4 pt-4 pb-nav space-y-6">
      <h1 className="font-heading text-xl font-semibold text-text">{t('nav.settings')}</h1>

      {/* Account */}
      <section>
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">{t('settings.account')}</p>
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 flex items-center gap-3 border-b border-border">
            <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center text-text-inverse font-bold font-heading flex-shrink-0">
              {user?.displayName?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              {editName ? (
                <div className="flex gap-2">
                  <input value={newDisplayName} onChange={e => setNewDisplayName(e.target.value)}
                    autoFocus
                    onKeyDown={e => e.key === 'Enter' && handleSaveName()}
                    className="flex-1 border border-border rounded-md px-2 py-1 text-sm text-text bg-surface focus:outline-none focus:border-accent" />
                  <button onClick={handleSaveName} disabled={savingName}
                    className="px-2 py-1 bg-accent text-text-inverse rounded-md text-xs font-semibold disabled:opacity-40">
                    <Check size={14} />
                  </button>
                </div>
              ) : (
                <button onClick={() => { setNewDisplayName(user?.displayName ?? ''); setEditName(true) }}
                  className="text-left">
                  <p className="text-sm font-semibold text-text truncate">{user?.displayName ?? '—'}</p>
                  <p className="text-xs text-text-muted">{t('common.edit')}</p>
                </button>
              )}
              {!editName && <p className="text-xs text-text-muted truncate">{user?.email ?? ''}</p>}
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 text-error hover:bg-error-light transition-colors"
          >
            <LogOut size={16} />
            <span className="text-sm font-medium">{t('settings.logout')}</span>
          </button>
        </div>
      </section>

      {/* Language */}
      <section>
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">{t('settings.language')}</p>
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          {LANGUAGES.map((lang, i) => (
            <button
              key={lang.code}
              onClick={() => i18n.changeLanguage(lang.code)}
              className={`w-full flex items-center justify-between px-4 py-3 transition-colors hover:bg-bg-subtle ${i > 0 ? 'border-t border-border' : ''}`}
            >
              <span className="flex items-center gap-2.5 text-sm text-text">
                <span className="text-xl">{lang.flag}</span>{lang.label}
              </span>
              {i18n.language === lang.code && <Check size={16} className="text-accent" />}
            </button>
          ))}
        </div>
      </section>

      {/* Label members */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">{t('members.labelMembers')}</p>
          <button onClick={() => setShowAddLabel(s => !s)} className="flex items-center gap-1 text-xs text-accent font-medium">
            <Plus size={14} />{t('members.addLabel')}
          </button>
        </div>

        {showAddLabel && (
          <div className="bg-surface border border-accent rounded-xl p-4 mb-3 space-y-3">
            <input value={labelName} onChange={e => setLabelName(e.target.value)}
              placeholder={t('members.namePlaceholder')}
              className="w-full border border-border rounded-md px-3 py-2 text-sm text-text bg-surface focus:outline-none focus:border-accent" />
            <input value={labelRelation} onChange={e => setLabelRelation(e.target.value)}
              placeholder={t('members.relation')}
              className="w-full border border-border rounded-md px-3 py-2 text-sm text-text bg-surface focus:outline-none focus:border-accent" />
            <button onClick={handleAddLabelMember} disabled={!labelName.trim()}
              className="w-full bg-accent text-text-inverse py-2.5 rounded-lg text-sm font-semibold disabled:opacity-40">
              {t('common.add')}
            </button>
          </div>
        )}

        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          {labelMembers.filter(m => !m.isMe).length === 0 && (
            <p className="px-4 py-3 text-sm text-text-muted">{t('members.none')}</p>
          )}
          {labelMembers.filter(m => !m.isMe).map((lm, i) => (
            <div key={lm.id}>
              {i > 0 && <div className="h-px bg-border" />}
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="w-8 h-8 rounded-full bg-bg-muted flex items-center justify-center text-sm font-bold text-text-secondary">
                  {lm.name[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text">{lm.name}</p>
                  {lm.relation && <p className="text-xs text-text-muted">{lm.relation}</p>}
                </div>
                <button onClick={() => deleteLabelMember(lm.id)} className="p-1.5 text-error hover:bg-error-light rounded transition-colors">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">{t('settings.categories')}</p>
          <button
            onClick={() => { setShowAddCat(s => !s); setEditCatId(null) }}
            className="flex items-center gap-1 text-xs text-accent font-medium"
          >
            <Plus size={14} />{t('settings.addCategory')}
          </button>
        </div>

        {showAddCat && (
          <div className="bg-surface border border-accent rounded-xl p-4 mb-3 space-y-3">
            <input
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              placeholder={t('settings.newCategoryName')}
              className="w-full border border-border rounded-md px-3 py-2 text-sm text-text bg-surface focus:outline-none focus:border-accent"
            />
            <div className="flex gap-2">
              {(['expense', 'income', 'both'] as CategoryType[]).map(tp => (
                <button
                  key={tp}
                  onClick={() => setNewCatType(tp)}
                  className={`flex-1 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                    newCatType === tp ? 'bg-accent text-text-inverse border-accent' : 'border-border text-text-secondary'
                  }`}
                >
                  {catTypeLabel(tp)}
                </button>
              ))}
            </div>
            <IconPicker selected={newCatIcon} onSelect={setNewCatIcon} />
            <button
              onClick={handleAddCategory}
              disabled={savingCat || !newCatName.trim()}
              className="w-full bg-accent text-text-inverse py-2.5 rounded-lg text-sm font-semibold disabled:opacity-40"
            >
              {savingCat ? t('common.saving') : t('common.add')}
            </button>
          </div>
        )}

        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          {categories.length === 0 && (
            <p className="px-4 py-3 text-sm text-text-muted">{t('settings.noCategories')}</p>
          )}
          {categories.map((cat, i) => (
            <div key={cat.id}>
              {i > 0 && <div className="h-px bg-border" />}
              {editCatId === cat.id ? (
                <div className="px-4 py-3 space-y-3">
                  <div className="flex gap-2">
                    <input
                      value={editCatName}
                      onChange={e => setEditCatName(e.target.value)}
                      className="flex-1 border border-border rounded-md px-3 py-2 text-sm text-text bg-surface focus:outline-none focus:border-accent"
                    />
                    <button onClick={handleSaveEditCat} className="px-3 py-2 bg-accent text-text-inverse rounded-md text-sm font-semibold">
                      <Check size={16} />
                    </button>
                  </div>
                  <IconPicker selected={editCatIcon} onSelect={setEditCatIcon} />
                </div>
              ) : (
                <div className="flex items-center gap-3 px-4 py-3">
                  <span className="text-xl">{cat.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text">{cat.name}</p>
                    <p className="text-xs text-text-muted">{catTypeLabel(cat.type)}</p>
                  </div>
                  <button
                    onClick={() => { setEditCatId(cat.id); setEditCatName(cat.name); setEditCatIcon(cat.icon); setShowAddCat(false) }}
                    className="p-1.5 text-text-muted hover:text-text transition-colors"
                  >
                    ✏️
                  </button>
                  <button onClick={() => deleteCategory(cat.id)} className="p-1.5 text-error hover:bg-error-light rounded transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Budgets */}
      <section>
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">{t('budget.title')}</p>
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          {categories.filter(c => c.type === 'expense' || c.type === 'both').length === 0 && (
            <p className="px-4 py-3 text-sm text-text-muted">{t('settings.noCategories')}</p>
          )}
          {categories.filter(c => c.type === 'expense' || c.type === 'both').map((cat, i) => {
            const existing = budgetMap[cat.id]
            const inputVal = budgetInputs[cat.id] ?? ''
            return (
              <div key={cat.id}>
                {i > 0 && <div className="h-px bg-border" />}
                <div className="flex items-center gap-3 px-4 py-3">
                  <span className="text-lg">{cat.icon}</span>
                  <span className="flex-1 text-sm font-medium text-text">{cat.name}</span>
                  <div className="flex items-center gap-2">
                    {existing && !inputVal && (
                      <span className="text-xs text-accent font-medium">{fmt(existing.amount, baseCurrency)}</span>
                    )}
                    <input
                      type="number"
                      value={inputVal}
                      placeholder={existing ? String(existing.amount) : '0'}
                      onChange={e => setBudgetInputs(p => ({ ...p, [cat.id]: e.target.value }))}
                      onBlur={() => { if (inputVal !== '') handleSaveBudget(cat.id) }}
                      onKeyDown={e => e.key === 'Enter' && handleSaveBudget(cat.id)}
                      className="w-24 border border-border rounded-md px-2 py-1.5 text-sm text-text bg-surface focus:outline-none focus:border-accent text-right"
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        <p className="text-xs text-text-muted mt-1.5 px-1">{t('budget.perMonth')} — {t('budget.hint')}</p>
      </section>

      {/* Templates / Schnelleingaben */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">{t('template.title')}</p>
          <button onClick={() => setShowAddTmpl(s => !s)} className="flex items-center gap-1 text-xs text-accent font-medium">
            <Plus size={14} />{t('template.add')}
          </button>
        </div>

        {showAddTmpl && (
          <div className="bg-surface border border-accent rounded-xl p-4 mb-3 space-y-3">
            <input value={tmplName} onChange={e => setTmplName(e.target.value)}
              placeholder={t('template.name')}
              className="w-full border border-border rounded-md px-3 py-2 text-sm text-text bg-surface focus:outline-none focus:border-accent" />
            <div className="flex bg-bg-muted rounded-lg p-1 gap-1">
              {(['expense', 'income'] as TransactionType[]).map(tp => (
                <button key={tp} onClick={() => { setTmplType(tp); setTmplCatId('') }}
                  className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors ${tmplType === tp ? 'bg-surface text-text shadow-sm' : 'text-text-secondary'}`}>
                  {tp === 'expense' ? t('common.expense') : t('common.income')}
                </button>
              ))}
            </div>
            <input type="text" inputMode="decimal" value={tmplAmount}
              onChange={e => setTmplAmount(e.target.value)} placeholder="0,00"
              className="w-full border border-border rounded-md px-3 py-2 text-lg font-bold text-text bg-surface focus:outline-none focus:border-accent" />
            <div className="grid grid-cols-4 gap-2">
              {categories.filter(c => c.type === tmplType || c.type === 'both').map(cat => (
                <button key={cat.id} onClick={() => setTmplCatId(cat.id)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs font-medium transition-colors ${tmplCatId === cat.id ? 'border-accent bg-accent-light text-accent-dark' : 'border-border bg-surface text-text-secondary'}`}>
                  <span className="text-lg">{cat.icon}</span>
                  <span className="truncate w-full text-center">{cat.name}</span>
                </button>
              ))}
            </div>
            <button onClick={handleAddTemplate} disabled={savingTmpl || !tmplName.trim() || !tmplAmount || !tmplCatId}
              className="w-full bg-accent text-text-inverse py-2.5 rounded-lg text-sm font-semibold disabled:opacity-40">
              {savingTmpl ? t('common.saving') : t('common.save')}
            </button>
          </div>
        )}

        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          {templates.length === 0 && <p className="px-4 py-3 text-sm text-text-muted">{t('template.none')}</p>}
          {templates.map((tmpl, i) => {
            const cat = categories.find(c => c.id === tmpl.categoryId)
            return (
              <div key={tmpl.id}>
                {i > 0 && <div className="h-px bg-border" />}
                <div className="flex items-center gap-3 px-4 py-3">
                  <span className="text-xl">{cat?.icon ?? '📌'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text">{tmpl.name}</p>
                    <p className="text-xs text-text-muted">{fmt(tmpl.amount, baseCurrency)} · {cat?.name}</p>
                  </div>
                  <button onClick={() => deleteTemplate(tmpl.id)} className="p-1.5 text-error hover:bg-error-light rounded transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Recurring / Fixkosten */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">{t('recurring.title')}</p>
          <button
            onClick={() => setShowAddRec(s => !s)}
            className="flex items-center gap-1 text-xs text-accent font-medium"
          >
            <Plus size={14} />{t('recurring.add')}
          </button>
        </div>

        {showAddRec && (
          <div className="bg-surface border border-accent rounded-xl p-4 mb-3 space-y-3">
            {/* Type */}
            <div className="flex bg-bg-muted rounded-lg p-1 gap-1">
              {(['expense', 'income'] as TransactionType[]).map(tp => (
                <button key={tp} onClick={() => { setRecType(tp); setRecCatId('') }}
                  className={`flex-1 py-2 rounded-md text-xs font-medium transition-colors ${recType === tp ? 'bg-surface text-text shadow-sm' : 'text-text-secondary'}`}>
                  {tp === 'expense' ? t('common.expense') : t('common.income')}
                </button>
              ))}
            </div>
            {/* Amount */}
            <input
              type="text" inputMode="decimal" value={recAmount}
              onChange={e => setRecAmount(e.target.value)}
              placeholder="0,00"
              className="w-full border border-border rounded-md px-3 py-2.5 text-xl font-bold text-text bg-surface focus:outline-none focus:border-accent"
            />
            {/* Frequency */}
            <div>
              <p className="text-xs text-text-muted mb-1.5">{t('recurring.frequency')}</p>
              <div className="flex gap-2 flex-wrap">
                {FREQUENCIES.map(f => (
                  <button key={f} onClick={() => setRecFreq(f)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${recFreq === f ? 'bg-accent text-text-inverse border-accent' : 'border-border text-text-secondary'}`}>
                    {t(`recurring.${f}`)}
                  </button>
                ))}
              </div>
            </div>
            {/* Start date */}
            <div>
              <p className="text-xs text-text-muted mb-1.5">{t('recurring.startDate')}</p>
              <input type="date" value={recStart} onChange={e => setRecStart(e.target.value)}
                className="w-full border border-border rounded-md px-3 py-2 text-sm text-text bg-surface focus:outline-none focus:border-accent" />
            </div>
            {/* Category */}
            <div>
              <p className="text-xs text-text-muted mb-1.5">{t('common.category')}</p>
              <div className="grid grid-cols-4 gap-2">
                {categories.filter(c => c.type === recType || c.type === 'both').map(cat => (
                  <button key={cat.id} onClick={() => setRecCatId(cat.id)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs font-medium transition-colors ${recCatId === cat.id ? 'border-accent bg-accent-light text-accent-dark' : 'border-border bg-surface text-text-secondary'}`}>
                    <span className="text-lg">{cat.icon}</span>
                    <span className="truncate w-full text-center">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>
            {/* Note */}
            <input type="text" value={recNote} onChange={e => setRecNote(e.target.value)}
              placeholder={t('transaction.notePlaceholder')}
              className="w-full border border-border rounded-md px-3 py-2 text-sm text-text bg-surface focus:outline-none focus:border-accent" />
            <button onClick={handleAddRecurring} disabled={savingRec || !recAmount || !recCatId}
              className="w-full bg-accent text-text-inverse py-2.5 rounded-lg text-sm font-semibold disabled:opacity-40">
              {savingRec ? t('common.saving') : t('common.save')}
            </button>
          </div>
        )}

        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          {recurring.length === 0 && (
            <p className="px-4 py-3 text-sm text-text-muted">{t('recurring.none')}</p>
          )}
          {recurring.map((rt, i) => {
            const cat = categories.find(c => c.id === rt.categoryId)
            return (
              <div key={rt.id}>
                {i > 0 && <div className="h-px bg-border" />}
                <div className="flex items-center gap-3 px-4 py-3">
                  <span className="text-xl">{cat?.icon ?? '📌'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text">{rt.note || cat?.name}</p>
                    <p className="text-xs text-text-muted">
                      {fmt(rt.amount, baseCurrency)} · {t(`recurring.${rt.frequency}`)} · {t('recurring.since')} {format(new Date(rt.startDate), 'dd.MM.yyyy')}
                    </p>
                  </div>
                  <button onClick={() => deleteRecurring(rt.id)} className="p-1.5 text-error hover:bg-error-light rounded transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Export */}
      <section>
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">{t('settings.exportTitle')}</p>
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-bg-subtle transition-colors disabled:opacity-50"
          >
            <div className="w-8 h-8 bg-info-light rounded-lg flex items-center justify-center text-info flex-shrink-0">
              <Download size={16} />
            </div>
            <span className="text-sm font-medium text-text flex-1 text-left">
              {exporting ? t('settings.exporting') : t('settings.exportBtn')}
            </span>
          </button>
        </div>
      </section>

      {/* Payment methods */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">{t('settings.paymentMethods')}</p>
          <button
            onClick={() => setShowAddPm(s => !s)}
            className="flex items-center gap-1 text-xs text-accent font-medium"
          >
            <Plus size={14} />{t('settings.addPaymentMethod')}
          </button>
        </div>

        {showAddPm && (
          <div className="bg-surface border border-accent rounded-xl p-4 mb-3 flex gap-2">
            <input
              value={newPmName}
              onChange={e => setNewPmName(e.target.value)}
              placeholder={t('settings.newPaymentMethodName')}
              className="flex-1 border border-border rounded-md px-3 py-2 text-sm text-text bg-surface focus:outline-none focus:border-accent"
              onKeyDown={e => e.key === 'Enter' && handleAddPaymentMethod()}
            />
            <button
              onClick={handleAddPaymentMethod}
              disabled={!newPmName.trim()}
              className="px-4 py-2 bg-accent text-text-inverse rounded-md text-sm font-semibold disabled:opacity-40"
            >
              {t('common.add')}
            </button>
          </div>
        )}

        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          {paymentMethods.length === 0 && (
            <p className="px-4 py-3 text-sm text-text-muted">{t('settings.noPaymentMethods')}</p>
          )}
          {paymentMethods.map((pm, i) => (
            <div key={pm.id}>
              {i > 0 && <div className="h-px bg-border" />}
              <div className="flex items-center gap-3 px-4 py-3">
                <span className="text-sm font-medium text-text flex-1">{pm.name}</span>
                <button onClick={() => deletePaymentMethod(pm.id)} className="p-1.5 text-error hover:bg-error-light rounded transition-colors">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
