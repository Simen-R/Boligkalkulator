import { BANKS } from '../data/content'
import { annuity } from '../lib/finance'
import { kr } from '../lib/format'
import type { AppState } from '../state'
import { MoneyInput } from './inputs'

interface Props {
  state: AppState
  update: (patch: Partial<AppState>) => void
}

export function BanksTab({ state: s, update }: Props) {
  const oldMonthly = annuity(s.byLan, s.byOld, s.byAar)
  const newMonthly = annuity(s.byLan, s.byNew, s.byAar)
  const diff = oldMonthly - newMonthly
  const saves = diff > 0
  const tone = saves ? 'good' : diff === 0 ? 'neutral' : 'bad'
  const headline = saves ? 'Du sparer per måned' : diff === 0 ? 'Ingen forskjell' : 'Dyrere per måned'

  return (
    <section className="banks-layout">
      <div>
        <h2 className="section-title">Renter og bankbytte</h2>
        <p className="section-intro">
          Forskjellen mellom billigste og dyreste bank kan være over ett prosentpoeng. På et lån på 3 mill. er det
          tusenvis av kroner i året.
        </p>

        <div className="bank-table">
          <div className="bank-table__head">
            <span>Bank</span>
            <span className="ta-right">Eff. rente*</span>
            <span>Merknad</span>
          </div>
          {BANKS.map((b) => (
            <div key={b.name} className="bank-table__row">
              <div>
                <div className="bank-table__name">{b.name}</div>
                <div className={`bank-table__cat ${b.cat === 'Storbank' ? 'is-stor' : ''}`}>{b.cat}</div>
              </div>
              <div className="bank-table__rate">{b.rate}</div>
              <div className="bank-table__note">{b.note}</div>
            </div>
          ))}
        </div>
        <p className="disclaimer">
          *Eksempeltall, effektiv rente for standardlån juli 2026 — faktisk rente settes individuelt. Sammenlign alltid
          oppdatert på Forbrukerrådets Finansportal før du velger.
        </p>

        <div className="info-box">
          <h4>Slik bytter du bank</h4>
          <p>
            Hele prosessen er digital: du signerer nye lånedokumenter med BankID, og den nye banken ordner innfrielsen
            av det gamle lånet. Be gjerne din nåværende bank matche et konkret tilbud først — de strekker seg ofte for å
            beholde deg. Fagforeningsmedlemmer (f.eks. LOfavør) bør også sjekke egne medlemsavtaler.
          </p>
        </div>
      </div>

      <div className="card switch-calc">
        <h3>Byttekalkulator</h3>
        <p className="card__sub">Hva sparer du på å bytte?</p>

        <label className="field-label">Lånebeløp</label>
        <MoneyInput
          size="md"
          step={50000}
          value={s.byLan}
          onChange={(n) => update({ byLan: n })}
          slider={{ min: 0, max: 10_000_000, step: 50_000 }}
        />

        <div className="grid-2">
          <div>
            <label className="field-label">Dagens rente</label>
            <MoneyInput
              size="md"
              step={0.05}
              suffix="%"
              value={s.byOld}
              onChange={(n) => update({ byOld: n })}
              slider={{ min: 2, max: 10, step: 0.05 }}
            />
          </div>
          <div>
            <label className="field-label">Ny rente</label>
            <MoneyInput
              size="md"
              step={0.05}
              suffix="%"
              value={s.byNew}
              onChange={(n) => update({ byNew: n })}
              slider={{ min: 2, max: 10, step: 0.05 }}
            />
          </div>
        </div>

        <label className="field-label">Restløpetid (år)</label>
        <MoneyInput
          size="md"
          step={1}
          suffix=""
          value={s.byAar}
          onChange={(n) => update({ byAar: Math.max(1, Math.round(n)) })}
          slider={{ min: 1, max: 30, step: 1 }}
        />

        <div className={`switch-result switch-result--${tone}`}>
          <div className="switch-result__headline">{headline}</div>
          <div className="switch-result__value">{kr(Math.abs(diff))}</div>
          <div className="switch-result__detail">
            {kr(Math.abs(diff) * 12)} i året · {kr(Math.abs(diff) * 12 * s.byAar)} over hele løpetiden
          </div>
        </div>
      </div>
    </section>
  )
}
