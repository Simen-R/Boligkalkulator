import { useState } from 'react'
import { useAppState, type Tab } from './state'
import { CalculatorTab } from './components/CalculatorTab'
import { RulesTab } from './components/RulesTab'
import { BanksTab } from './components/BanksTab'
import { BsuTab } from './components/BsuTab'
import { PlanTab } from './components/PlanTab'

const TABS: { id: Tab; label: string }[] = [
  { id: 'kalkulator', label: 'Kalkulator' },
  { id: 'regler', label: 'Regler' },
  { id: 'banker', label: 'Banker og bytte' },
  { id: 'bsu', label: 'BSU og førstehjem' },
  { id: 'plan', label: 'Plan' },
]

export default function App() {
  const [tab, setTab] = useState<Tab>('kalkulator')
  const [state, update] = useAppState()

  return (
    <div className="wrap">
      <header className="top">
        <div>
          <div className="brand">
            <div className="brand__logo">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 11.5 12 4l9 7.5" />
                <path d="M5 10v9h14v-9" />
                <path d="M10 19v-5h4v5" />
              </svg>
            </div>
            <span className="brand__name">Boligplanlegger 2026</span>
          </div>
          <h1>Hvor mye bolig har du råd til?</h1>
          <p className="top__intro">
            Planleggingsverktøy for deg som skal kjøpe din første bolig i løpet av det neste året. Test tallene dine mot
            utlånsforskriften, helt uforpliktende.
          </p>
        </div>
        <div className="top__meta">
          <div>Styringsrente 4,25 %</div>
          <div>Satser oppdatert juli 2026</div>
        </div>
      </header>

      <nav className="tabs">
        {TABS.map((t) => (
          <button key={t.id} type="button" className={tab === t.id ? 'is-active' : ''} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>

      {tab === 'kalkulator' && <CalculatorTab state={state} update={update} />}
      {tab === 'regler' && <RulesTab />}
      {tab === 'banker' && <BanksTab state={state} update={update} />}
      {tab === 'bsu' && <BsuTab />}
      {tab === 'plan' && <PlanTab state={state} update={update} />}
    </div>
  )
}
