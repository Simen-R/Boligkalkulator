import { PLAN } from '../data/content'
import type { AppState } from '../state'

interface Props {
  state: AppState
  update: (patch: Partial<AppState>) => void
  onOpenSjekk?: () => void
}

export function PlanTab({ state: s, update, onOpenSjekk }: Props) {
  const total = PLAN.reduce((n, g) => n + g.items.length, 0)
  const done = PLAN.reduce((n, g) => n + g.items.filter((it) => s.checked[it.id]).length, 0)
  const pct = Math.round((done / total) * 100)

  const toggle = (id: string) => update({ checked: { ...s.checked, [id]: !s.checked[id] } })

  return (
    <section className="plan-layout">
      <div className="plan-head">
        <div>
          <h2 className="section-title">Din 12-måneders plan</h2>
          <p className="section-intro" style={{ marginBottom: 0 }}>
            Kryss av etter hvert som du kommer i mål. Fremdriften lagres automatisk.
          </p>
        </div>
        <div className="plan-progress">
          <div className="plan-progress__pct">{pct}%</div>
          <div className="plan-progress__count">
            {done} av {total} fullført
          </div>
        </div>
      </div>
      <div className="plan-bar">
        <div className="plan-bar__fill" style={{ width: pct + '%' }} />
      </div>

      <div className="plan-groups">
        {PLAN.map((g) => (
          <div key={g.phase}>
            <div className="plan-phase">{g.phase}</div>
            <div className="plan-card">
              {g.items.map((it) => {
                const on = !!s.checked[it.id]
                return (
                  <label key={it.id} className={`plan-item ${on ? 'is-done' : ''}`}>
                    <button type="button" className="plan-check" aria-pressed={on} onClick={() => toggle(it.id)}>
                      {on && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 12.5 9.5 18 20 6" />
                        </svg>
                      )}
                    </button>
                    <span className="plan-item__text" onClick={() => toggle(it.id)}>
                      {it.text}
                    </span>
                  </label>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {onOpenSjekk && (
        <div className="info-box plan-cta">
          <div>
            <h4>Fant du en bolig du vurderer?</h4>
            <p>
              Lim inn FINN-annonsen i Boligsjekk, så får du totalpris, månedskostnad, maks budgrense og røde flagg —
              målt mot dine egne tall.
            </p>
          </div>
          <button type="button" className="btn" onClick={onOpenSjekk}>
            Åpne Boligsjekk
          </button>
        </div>
      )}
    </section>
  )
}
