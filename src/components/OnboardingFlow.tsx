import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface Props {
  onDone: () => void
}

const STEPS = [
  {
    emoji: '💼',
    titleKey: 'onboarding.step1Title',
    textKey: 'onboarding.step1Text',
  },
  {
    emoji: '📊',
    titleKey: 'onboarding.step2Title',
    textKey: 'onboarding.step2Text',
  },
  {
    emoji: '👥',
    titleKey: 'onboarding.step3Title',
    textKey: 'onboarding.step3Text',
  },
]

export default function OnboardingFlow({ onDone }: Props) {
  const { t } = useTranslation()
  const [step, setStep] = useState(0)
  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  function next() {
    if (isLast) {
      localStorage.setItem('onboarded', 'true')
      onDone()
    } else {
      setStep(s => s + 1)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-bg-subtle flex flex-col items-center justify-center px-6 max-w-lg mx-auto">
      {/* Skip */}
      <button
        onClick={() => { localStorage.setItem('onboarded', 'true'); onDone() }}
        className="absolute top-14 right-6 text-sm text-text-muted hover:text-text transition-colors"
      >
        {t('onboarding.skip')}
      </button>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center text-center w-full max-w-sm">
        {step === 0
          ? <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="Kontor" className="w-24 h-24 mb-8" />
          : <div className="text-7xl mb-8">{current.emoji}</div>
        }
        <h2 className="font-heading text-2xl font-bold text-text mb-4">{t(current.titleKey)}</h2>
        <p className="text-base text-text-secondary leading-relaxed">{t(current.textKey)}</p>
      </div>

      {/* Dots + button */}
      <div className="pb-16 w-full max-w-sm space-y-6">
        <div className="flex justify-center gap-2">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-300 ${i === step ? 'w-6 h-2 bg-accent' : 'w-2 h-2 bg-border'}`}
            />
          ))}
        </div>
        <button
          onClick={next}
          className="w-full flex items-center justify-center gap-2 bg-accent text-text-inverse py-4 rounded-xl font-semibold text-base hover:bg-accent-hover transition-colors"
        >
          {isLast ? t('onboarding.done') : t('onboarding.next')}
          {!isLast && <ChevronRight size={20} />}
        </button>
      </div>
    </div>
  )
}
