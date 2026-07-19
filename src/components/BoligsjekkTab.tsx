import { useState } from 'react'
import { kr } from '../lib/format'
import { analyzeListing, parseFinnText, type ListingAnalysis } from '../lib/listing'
import { BID_CHECKS } from '../data/content'
import { effectiveDebt, totalIncome, type AppState, type ListingState } from '../state'
import { MoneyInput, Segmented } from './inputs'

interface Props {
  state: AppState
  update: (patch: Partial<AppState>) => void
}

const VERDICT: Record<ListingAnalysis['verdict'], { cls: string; label: string }> = {
  innenfor: { cls: 'good', label: 'Innenfor rammen din' },
  trangt: { cls: 'neutral', label: 'Mulig, men trangt' },
  over: { cls: 'bad', label: 'Over rammen din' },
}

const EXAMPLE: ListingState = {
  boligtype: 'Leilighet',
  eieform: 'andel',
  pris: 4_200_000,
  fellesgjeld: 320_000,
  felleskost: 4_200,
  omkostninger: 0,
  areal: 62,
  byggeaar: 1972,
  soverom: 2,
  energi: 'D',
  tg2: 3,
  tg3: 0,
}

export function BoligsjekkTab({ state: s, update }: Props) {
  const [raw, setRaw] = useState('')
  const [foundMsg, setFoundMsg] = useState<string | null>(null)

  const L = s.listing
  const setL = (patch: Partial<ListingState>) => update({ listing: { ...s.listing, ...patch } })
  const toggle = (id: string) => update({ checked: { ...s.checked, [id]: !s.checked[id] } })

  const income = totalIncome(s)
  const debt = effectiveDebt(s)
  const calcInput = { ...debt, income, borrowers: s.borrowers, egenkapital: s.egenkapital, barn: s.barn, rente: s.rente, aar: s.aar }
  const a = analyzeListing(calcInput, L)

  const doParse = (text: string) => {
    const { patch, found } = parseFinnText(text)
    if (found.length > 0) {
      setL(patch)
      setFoundMsg('Fant: ' + found.join(', '))
    } else if (text.trim()) {
      setFoundMsg('Fant ingen nøkkeltall — fyll inn feltene under manuelt.')
    }
  }

  return (
    <section className="sjekk-layout">
      {/* Inndata */}
      <div className="card input-panel">
        <h2>Sjekk en konkret bolig</h2>
        <p className="card__sub">Lim inn teksten fra en FINN-annonse, så hentes nøkkeltallene automatisk.</p>

        <textarea
          className="paste-box"
          placeholder={'Marker alt på annonsesiden (Ctrl+A), kopier og lim inn her …'}
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          onPaste={(e) => doParse(e.clipboardData.getData('text'))}
        />
        <div className="paste-actions">
          <button type="button" className="btn btn--sm" onClick={() => doParse(raw)}>
            Hent nøkkeltall
          </button>
          <button type="button" className="btn btn--sm btn--ghost" onClick={() => { setL(EXAMPLE); setFoundMsg('Eksempelbolig lagt inn.') }}>
            Prøv et eksempel
          </button>
        </div>
        {foundMsg && <div className="paste-found">{foundMsg}</div>}
        <p className="paste-hint">
          Vil du gå dypere? Prøv{' '}
          <a href="https://visning.ai/" target="_blank" rel="noopener noreferrer">
            visning.ai
          </a>{' '}
          — lim inn FINN-lenken der og få en AI-analyse av salgsoppgaven og tilstandsrapporten. Ta med tallene tilbake
          hit for å sjekke dem mot din egen økonomi.
        </p>

        <div className="divider" />

        <div className="field-label">Eieform</div>
        <Segmented
          variant="outline"
          options={[
            { value: 'selveier', label: 'Selveier' },
            { value: 'andel', label: 'Borettslag/andel' },
          ]}
          value={L.eieform}
          onChange={(v) => setL({ eieform: v })}
        />

        <label className="field-label">Prisantydning</label>
        <MoneyInput value={L.pris} onChange={(n) => setL({ pris: n })} step={50_000} slider={{ min: 0, max: 12_000_000, step: 50_000 }} />

        <div className="grid-2">
          <div>
            <label className="field-label">Fellesgjeld</label>
            <MoneyInput size="md" step={10_000} value={L.fellesgjeld} onChange={(n) => setL({ fellesgjeld: n })} />
          </div>
          <div>
            <label className="field-label">
              Felleskost <span>/ mnd</span>
            </label>
            <MoneyInput size="md" step={100} value={L.felleskost} onChange={(n) => setL({ felleskost: n })} />
          </div>
        </div>

        <label className="field-label">
          Omkostninger <span>(0 = anslås automatisk)</span>
        </label>
        <MoneyInput size="md" step={5_000} value={L.omkostninger} onChange={(n) => setL({ omkostninger: n })} />

        <div className="grid-2">
          <div>
            <label className="field-label">
              Areal <span>(BRA-i)</span>
            </label>
            <MoneyInput size="md" step={1} suffix="m²" value={L.areal} onChange={(n) => setL({ areal: n })} />
          </div>
          <div>
            <label className="field-label">Byggeår</label>
            <MoneyInput size="md" step={1} suffix="" value={L.byggeaar} onChange={(n) => setL({ byggeaar: Math.round(n) })} />
          </div>
        </div>

        <div className="field-label">
          Energimerke <span>(fra annonsen)</span>
        </div>
        <Segmented
          options={[{ value: '', label: '?' }, ...'ABCDEFG'.split('').map((c) => ({ value: c, label: c }))]}
          value={L.energi}
          onChange={(v) => setL({ energi: v })}
        />

        <div className="divider" />
        <div className="field-label">
          Fra tilstandsrapporten <span>(antall avvik)</span>
        </div>
        <div className="grid-2">
          <div>
            <label className="field-label field-label--small">TG3 — store avvik</label>
            <MoneyInput size="sm" step={1} suffix="stk" value={L.tg3} onChange={(n) => setL({ tg3: Math.max(0, Math.round(n)) })} />
          </div>
          <div>
            <label className="field-label field-label--small">TG2 — vesentlige avvik</label>
            <MoneyInput size="sm" step={1} suffix="stk" value={L.tg2} onChange={(n) => setL({ tg2: Math.max(0, Math.round(n)) })} />
          </div>
        </div>
      </div>

      {/* Analyse */}
      {!a ? (
        <div className="results">
          <div className="card sjekk-empty">
            <h3>Ingen bolig lagt inn ennå</h3>
            <p>
              Lim inn en FINN-annonse eller fyll inn prisantydning til venstre, så vurderes boligen mot tallene dine fra
              kalkulatoren: totalpris, lånebehov, månedskostnad, stresstest og hvor høyt du kan by. For en dypere
              gjennomgang av selve boligen (salgsoppgave og tilstandsrapport) kan du også prøve{' '}
              <a href="https://visning.ai/" target="_blank" rel="noopener noreferrer">
                visning.ai
              </a>
              .
            </p>
          </div>
        </div>
      ) : (
        <div className="results">
          <div className={`switch-result switch-result--${VERDICT[a.verdict].cls} sjekk-verdict`}>
            <div className="switch-result__headline">
              Vurdering{L.boligtype ? ` · ${L.boligtype.toLowerCase()}` : ''}
              {L.areal > 0 ? ` · ${L.areal} m²` : ''}
              {L.soverom > 0 ? ` · ${L.soverom} soverom` : ''}
            </div>
            <div className="switch-result__value">{VERDICT[a.verdict].label}</div>
            <div className="switch-result__detail">
              {a.verdict === 'over'
                ? 'Med dagens tall får du trolig ikke finansiert denne boligen. Se hvilke krav som stopper deg under.'
                : a.verdict === 'trangt'
                  ? 'Boligen kan gå gjennom hos banken, men marginene er små — særlig hvis budrunden drar seg til.'
                  : 'Boligen ligger innenfor alle de tre kravene i utlånsforskriften, med rom for budrunde.'}
            </div>
          </div>

          <div className="kpi-grid">
            <div className="kpi kpi--hero">
              <div className="kpi__label">Totalpris</div>
              <div className="kpi__value">{kr(a.totalpris)}</div>
              <div className="kpi__sub">
                inkl. fellesgjeld og omkostninger{a.omkEstimated ? ' (anslått)' : ''}
              </div>
            </div>
            <div className="kpi">
              <div className="kpi__label">Lånebehov</div>
              <div className="kpi__value">{kr(a.loan)}</div>
              <div className="kpi__sub">etter {kr(s.egenkapital)} egenkapital</div>
            </div>
            <div className="kpi">
              <div className="kpi__label">Månedskostnad</div>
              <div className="kpi__value">{kr(a.monthly)}</div>
              <div className="kpi__sub">lån + felleskost{a.strom > 0 ? ' + strøm (anslag)' : ''}</div>
            </div>
            <div className={`kpi ${a.maxBud < L.pris ? 'kpi--alert' : ''}`}>
              <div className="kpi__label">Maks budgrense</div>
              <div className="kpi__value">{kr(a.maxBud)}</div>
              <div className="kpi__sub">anslag ut fra tallene dine</div>
            </div>
          </div>

          <div className="card">
            <h3>Tåler økonomien din boligen?</h3>
            <p className="card__sub">De tre kravene i utlånsforskriften, målt på akkurat denne boligen</p>
            <div className="check-rows">
              <CheckRow
                ok={a.ekOk}
                label="Egenkapital"
                detail={`Krever ${kr(a.minEk)} (10 % + omkostninger) — du har ${kr(s.egenkapital)}`}
                badge={a.ekOk ? 'OK' : `Mangler ${kr(a.minEk - s.egenkapital)}`}
              />
              <CheckRow
                ok={a.debtOk}
                label="Gjeldsgrad"
                detail={`Samlet gjeld blir ${kr(a.totalDebt)} inkl. fellesgjeld — taket er ${kr(a.debtCap)} (5× inntekt)`}
                badge={a.debtOk ? 'OK' : `${kr(a.totalDebt - a.debtCap)} over`}
              />
              <CheckRow
                ok={a.stressOk}
                label={`Stresstest (${a.stressRate.toLocaleString('nb-NO')} % rente)`}
                detail={`Terminbeløp ${kr(a.stressPayment)} + felleskost ${kr(L.felleskost)} mot rommet ditt`}
                badge={a.stressOk ? `${kr(a.stressMargin)}/mnd i margin` : `Mangler ${kr(-a.stressMargin)}/mnd`}
              />
            </div>
          </div>

          <div className="chart-grid">
            <div className="card">
              <h3>Hva koster den i måneden?</h3>
              <p className="card__sub">Ved {s.rente.toLocaleString('nb-NO')} % rente og {s.aar} års nedbetaling</p>
              <div className="cost-rows">
                <div className="cost-row">
                  <span>Boliglån ({kr(a.loan)})</span>
                  <strong>{kr(a.lanMnd)}</strong>
                </div>
                <div className="cost-row">
                  <span>Felleskostnader</span>
                  <strong>{kr(L.felleskost)}</strong>
                </div>
                {a.strom > 0 && (
                  <div className="cost-row">
                    <span>Strøm og oppvarming (anslag{L.energi ? `, merke ${L.energi}` : ''})</span>
                    <strong>{kr(a.strom)}</strong>
                  </div>
                )}
                <div className="cost-row cost-row--sum">
                  <span>Sum per måned</span>
                  <strong>{kr(a.monthly)}</strong>
                </div>
                <div className="cost-row cost-row--faint">
                  <span>Ved stresstest ({a.stressRate.toLocaleString('nb-NO')} %)</span>
                  <strong>{kr(a.stressPayment + L.felleskost + a.strom)}</strong>
                </div>
              </div>
            </div>

            <div className="card">
              <h3>Hvor høyt kan du by?</h3>
              <p className="card__sub">Budrunder ender ofte over prisantydning — kjenn taket ditt</p>
              <BidBar label="Prisantydning" value={L.pris} max={Math.max(L.pris, a.maxBud)} muted />
              <BidBar label="Din maksgrense (anslag)" value={a.maxBud} max={Math.max(L.pris, a.maxBud)} bad={a.maxBud < L.pris} />
              <p className={`bid-note ${a.maxBud < L.pris ? 'bid-note--bad' : ''}`}>
                {a.maxBud >= L.pris
                  ? `Du har rom for å by inntil ${kr(a.maxBud - L.pris)} over prisantydning.`
                  : `Maksgrensen din ligger ${kr(L.pris - a.maxBud)} under prisantydningen — denne budrunden bør du trolig stå over.`}
              </p>
              {L.areal > 0 && (
                <div className="bid-facts">
                  <span>
                    {kr(Math.round(a.kvmPris))}/m² <em>inkl. fellesgjeld</em>
                  </span>
                  {a.fgShare > 0 && (
                    <span>
                      {Math.round(a.fgShare * 100)} % <em>fellesgjeld av totalpris</em>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <h3>Dette bør du sjekke før du byr</h3>
            <p className="card__sub">Generert ut fra tallene på boligen</p>
            <div className="flag-list">
              {a.flags.map((f) => (
                <div key={f.title} className={`flag flag--${f.level}`}>
                  <span className="flag__dot" />
                  <div>
                    <div className="flag__title">{f.title}</div>
                    <div className="flag__body">{f.body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="plan-phase">Sjekkliste før budrunden</div>
            <div className="plan-card">
              {BID_CHECKS.map((it) => {
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
            <div className="info-box">
              <h4>I selve budrunden</h4>
              <p>
                Bud er juridisk bindende — du kan ikke trekke et bud som er kommet frem til megler. Første bud må normalt
                ha frist til minst kl. 12 dagen etter siste annonserte visning. Ikke by uten gyldig finansieringsbevis,
                og fortell aldri megler hva maksgrensen din er.
              </p>
            </div>
          </div>

          <p className="disclaimer">
            Analysen er et forenklet anslag basert på tallene dine fra kalkulatoren og det du har lagt inn om boligen.
            Banken gjør alltid en individuell vurdering. Dette er planlegging, ikke finansiell rådgivning.
          </p>
        </div>
      )}
    </section>
  )
}

function CheckRow({ ok, label, detail, badge }: { ok: boolean; label: string; detail: string; badge: string }) {
  return (
    <div className="check-row">
      <span className={`check-row__dot ${ok ? 'is-ok' : 'is-fail'}`} />
      <div className="check-row__text">
        <div className="check-row__label">{label}</div>
        <div className="check-row__detail">{detail}</div>
      </div>
      <span className={`check-row__badge ${ok ? 'is-ok' : 'is-fail'}`}>{badge}</span>
    </div>
  )
}

function BidBar({ label, value, max, muted, bad }: { label: string; value: number; max: number; muted?: boolean; bad?: boolean }) {
  const w = max > 0 ? Math.max(3, (value / max) * 100) : 0
  return (
    <div className="bid-bar">
      <div className="bid-bar__head">
        <span>{label}</span>
        <span className="bid-bar__value">{kr(value)}</span>
      </div>
      <div className="limit-bar__track">
        <div className={`limit-bar__fill ${bad ? 'is-neck' : ''}`} style={{ width: w + '%', opacity: muted ? 0.35 : 1 }} />
      </div>
    </div>
  )
}
