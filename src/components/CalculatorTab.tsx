import { compute } from '../lib/finance'
import { kr } from '../lib/format'
import { NECK_LABELS, NECK_TIPS } from '../data/content'
import { effectiveDebt, totalIncome, type AppState } from '../state'
import { MoneyInput, Segmented, Slider, SliderRow } from './inputs'
import { LimitsChart, ProjectionChart } from './charts'

interface Props {
  state: AppState
  update: (patch: Partial<AppState>) => void
}

const DEBT_FIELDS = [
  { label: 'Studielån', key: 'studielan', max: 1_000_000, step: 10_000 },
  { label: 'Billån', key: 'billan', max: 1_000_000, step: 10_000 },
  { label: 'Forbrukslån', key: 'forbrukslan', max: 500_000, step: 5_000 },
  { label: 'Kredittkortramme', key: 'kredittramme', max: 300_000, step: 5_000 },
] as const

const INCOME_RANGE = { min: 0, max: 2_000_000, step: 10_000 }
const EK_RANGE = { min: 0, max: 3_000_000, step: 10_000 }
const SPARING_RANGE = { min: 0, max: 25_000, step: 500 }
const BARN_RANGE = { min: 0, max: 6, step: 1 }
const NEDGJELD_RANGE = { min: 0, max: 300_000, step: 5_000 }

export function CalculatorTab({ state: s, update }: Props) {
  const income = totalIncome(s)
  const debt = effectiveDebt(s)
  const calcInput = { ...debt, income, borrowers: s.borrowers, egenkapital: s.egenkapital, barn: s.barn, rente: s.rente, aar: s.aar }
  const c = compute(calcInput)

  // Fremskrivning 12 måneder: spart egenkapital, lønnsvekst og nedbetalt studielån
  const futureInput = {
    ...calcInput,
    egenkapital: s.egenkapital + s.sparing * 12,
    income: income * (1 + s.lonnsvekst / 100),
    studielan: Math.max(0, debt.studielan - s.nedgjeld),
  }
  const c2 = compute(futureInput)
  const delta = c2.maxPurchase - c.maxPurchase
  const projDelta = (delta >= 0 ? '+' : '−') + kr(Math.abs(delta))

  const perPersonDebt = s.borrowers === 2 && s.debtMode === 'person'
  const maxLimit = Math.max(...c.limits.map((l) => l.value), 1)

  const kpis = [
    { label: 'Maks kjøpesum', value: kr(c.maxPurchase), sub: 'inkl. egenkapital', variant: 'hero' },
    { label: 'Maks boliglån', value: kr(c.maxLoan), sub: s.aar + ' års nedbetaling', variant: 'plain' },
    { label: 'Månedskostnad', value: kr(c.monthly), sub: 'ved ' + fmtPct(s.rente) + ' rente', variant: 'plain' },
    { label: 'Flaskehals', value: NECK_LABELS[c.neck.key], sub: 'begrenser deg mest', variant: 'alert' },
  ]

  return (
    <section className="calc-layout">
      {/* Inndata */}
      <div className="card input-panel">
        <h2>Din situasjon</h2>
        <p className="card__sub">Endre tallene — alt regnes om live.</p>

        <div className="field-label">Antall låntakere</div>
        <Segmented
          variant="outline"
          options={[
            { value: 1, label: '1 person' },
            { value: 2, label: '2 personer' },
          ]}
          value={s.borrowers}
          onChange={(v) => update({ borrowers: v })}
        />

        {s.borrowers === 1 ? (
          <>
            <label className="field-label">
              Bruttoinntekt <span>/ år</span>
            </label>
            <MoneyInput value={s.income1} onChange={(n) => update({ income1: n })} slider={INCOME_RANGE} />
          </>
        ) : (
          <>
            <div className="field-label">
              Bruttoinntekt <span>/ år, per person</span>
            </div>
            <div className="grid-2">
              <div>
                <label className="field-label field-label--small">Person 1</label>
                <MoneyInput size="md" value={s.income1} onChange={(n) => update({ income1: n })} slider={INCOME_RANGE} />
              </div>
              <div>
                <label className="field-label field-label--small">Person 2</label>
                <MoneyInput size="md" value={s.income2} onChange={(n) => update({ income2: n })} slider={INCOME_RANGE} />
              </div>
            </div>
            <div className="income-total">
              Samlet bruttoinntekt: <strong>{kr(income)}</strong>
            </div>
          </>
        )}

        <label className="field-label">
          Egenkapital <span>(inkl. BSU)</span>
        </label>
        <MoneyInput value={s.egenkapital} onChange={(n) => update({ egenkapital: n })} slider={EK_RANGE} />

        <div className="grid-2">
          <div>
            <label className="field-label">Sparing / mnd</label>
            <MoneyInput size="md" step={500} value={s.sparing} onChange={(n) => update({ sparing: n })} slider={SPARING_RANGE} />
          </div>
          <div>
            <label className="field-label">Antall barn</label>
            <MoneyInput
              size="md"
              step={1}
              suffix=""
              value={s.barn}
              onChange={(n) => update({ barn: Math.max(0, Math.round(n)) })}
              slider={BARN_RANGE}
            />
          </div>
        </div>

        <div className="divider" />
        <div className="debt-head">
          <span className="field-label" style={{ margin: 0 }}>
            Eksisterende gjeld
          </span>
          {s.borrowers === 2 && (
            <Segmented
              options={[
                { value: 'samlet', label: 'Samlet' },
                { value: 'person', label: 'Per person' },
              ]}
              value={s.debtMode}
              onChange={(v) => update({ debtMode: v })}
            />
          )}
        </div>

        {!perPersonDebt ? (
          DEBT_FIELDS.map((d) => (
            <div key={d.key} className="debt-row">
              <div className="debt-row__top">
                <span>{d.label}</span>
                <MoneyInput size="sm" step={d.step} alignRight value={s[d.key]} onChange={(n) => update({ [d.key]: n })} />
              </div>
              <Slider min={0} max={d.max} step={d.step} value={s[d.key]} onChange={(n) => update({ [d.key]: n })} />
            </div>
          ))
        ) : (
          <>
            <div className="debt-pair-head">
              <span>Person 1</span>
              <span>Person 2</span>
            </div>
            {DEBT_FIELDS.map((d) => {
              const key2 = `${d.key}2` as const
              const range = { min: 0, max: d.max, step: d.step }
              return (
                <div key={d.key} className="debt-pair">
                  <div className="debt-pair__label">
                    <span>{d.label}</span>
                    <span className="debt-pair__total">samlet {kr((s[d.key] || 0) + (s[key2] || 0))}</span>
                  </div>
                  <div className="grid-2 grid-2--tight">
                    <MoneyInput size="sm" step={d.step} alignRight value={s[d.key]} onChange={(n) => update({ [d.key]: n })} slider={range} />
                    <MoneyInput size="sm" step={d.step} alignRight value={s[key2]} onChange={(n) => update({ [key2]: n })} slider={range} />
                  </div>
                </div>
              )
            })}
          </>
        )}

        <div className="divider" />

        <SliderRow
          label="Boliglånsrente"
          valueLabel={fmtPct(s.rente)}
          min={4}
          max={9}
          step={0.05}
          value={s.rente}
          onChange={(n) => update({ rente: n })}
          minLabel="4 %"
          maxLabel="9 %"
        />
        <SliderRow
          label="Nedbetalingstid"
          valueLabel={s.aar + ' år'}
          min={15}
          max={30}
          step={1}
          value={s.aar}
          onChange={(n) => update({ aar: Math.round(n) })}
          minLabel="15 år"
          maxLabel="30 år"
        />
      </div>

      {/* Resultater */}
      <div className="results">
        <div className="kpi-grid">
          {kpis.map((k) => (
            <div key={k.label} className={`kpi kpi--${k.variant}`}>
              <div className="kpi__label">{k.label}</div>
              <div className={`kpi__value ${k.variant === 'alert' ? 'kpi__value--small' : ''}`}>{k.value}</div>
              <div className="kpi__sub">{k.sub}</div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="neck-head">
            <span className="neck-dot" />
            <h2>Flaskehals: {NECK_LABELS[c.neck.key]}</h2>
          </div>
          <p className="neck-tip">{NECK_TIPS[c.neck.key]}</p>
          <div className="limit-bars">
            {c.limits.map((l) => {
              const isNeck = l.key === c.neck.key
              return (
                <div key={l.key}>
                  <div className={`limit-bar__head ${isNeck ? 'is-neck' : ''}`}>
                    <span>
                      {l.label} {isNeck && '· flaskehals'}
                    </span>
                    <span className="limit-bar__value">{kr(l.value)}</span>
                  </div>
                  <div className="limit-bar__track">
                    <div
                      className={`limit-bar__fill ${isNeck ? 'is-neck' : ''}`}
                      style={{ width: Math.max(3, (l.value / maxLimit) * 100) + '%' }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="chart-grid">
          <div className="card">
            <h3>De tre grensene</h3>
            <p className="card__sub">Maks kjøpesum etter hvert krav</p>
            <div className="chart-box">
              <LimitsChart limits={c.limits} neckKey={c.neck.key} />
            </div>
          </div>
          <div className="card">
            <div className="chart-card-head">
              <div>
                <h3>Om 12 måneder</h3>
                <p className="card__sub">Hvis du fortsetter å spare</p>
              </div>
              <span className="chart-delta">{projDelta}</span>
            </div>
            <div className="chart-box">
              <ProjectionChart
                now={[c.maxPurchase, c.maxLoan, s.egenkapital]}
                future={[c2.maxPurchase, c2.maxLoan, futureInput.egenkapital]}
              />
            </div>
          </div>
        </div>

        <div className="projection-card">
          <div className="projection-card__title">Forutsetninger for fremskrivningen</div>
          <div className="grid-3">
            <SliderRow
              label="Lønnsvekst / år"
              valueLabel={fmtPct(s.lonnsvekst)}
              min={0}
              max={8}
              step={0.5}
              value={s.lonnsvekst}
              onChange={(n) => update({ lonnsvekst: n })}
            />
            <div>
              <label className="field-label field-label--plain">Nedbetalt gjeld i året</label>
              <MoneyInput size="sm" step={5000} value={s.nedgjeld} onChange={(n) => update({ nedgjeld: n })} slider={NEDGJELD_RANGE} />
            </div>
            <div>
              <div className="field-label field-label--plain">Egenkapital om 12 mnd</div>
              <div className="projection-card__value">{kr(futureInput.egenkapital)}</div>
            </div>
          </div>
        </div>

        <p className="disclaimer">
          Estimatene er forenklede og bruker anslåtte skatte- og levekostnader (SIFO-nær). Bankene gjør individuelle
          vurderinger. Dette er planlegging, ikke finansiell rådgivning.
        </p>
      </div>
    </section>
  )
}

function fmtPct(n: number): string {
  return n.toLocaleString('nb-NO') + ' %'
}
