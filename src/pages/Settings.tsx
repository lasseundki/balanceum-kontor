import { useState } from 'react'
import { LogOut, Plus, Trash2, Check, ChevronDown, ChevronUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import {
  useCategories, useCategoryActions,
  usePaymentMethods, usePaymentMethodActions,
} from '../hooks/useWorkspaceFirestore'
import type { CategoryType } from '../types'

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

export default function Settings() {
  const { t, i18n } = useTranslation()
  const { user, logout } = useAuth()

  const categories = useCategories()
  const { addCategory, updateCategory, deleteCategory } = useCategoryActions()
  const paymentMethods = usePaymentMethods()
  const { addPaymentMethod, deletePaymentMethod } = usePaymentMethodActions()

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
            <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center text-text-inverse font-bold font-heading">
              {user?.displayName?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text truncate">{user?.displayName ?? '—'}</p>
              <p className="text-xs text-text-muted truncate">{user?.email ?? ''}</p>
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
