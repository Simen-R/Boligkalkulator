// Boligsjekk: parser for FINN-annonsetekst + vurdering av en konkret bolig
// mot brukerens økonomi. Ingen UI-avhengigheter.

import { annuity, compute, principalFromPayment, type ComputeInput } from './finance'
import type { ListingState } from '../state'

/* ---------- Parsing av innlimt annonsetekst ---------- */

/** "4 500 000 kr" → 4500000. Tåler vanlig/hardt mellomrom og punktum. */
function parseKr(raw: string): number {
  const digits = raw.replace(/[^\d]/g, '')
  return digits ? parseInt(digits, 10) : 0
}

/** "65,5" → 65.5 */
function parseDec(raw: string): number {
  const n = parseFloat(raw.replace(/\s/g, '').replace(',', '.'))
  return Number.isNaN(n) ? 0 : n
}

function matchKr(text: string, label: RegExp): number | undefined {
  const re = new RegExp(label.source + '\\D{0,20}?([0-9][0-9\\s\\u00a0\\u202f.]*)', 'i')
  const m = text.match(re)
  return m ? parseKr(m[1]) : undefined
}

export interface ParseResult {
  patch: Partial<ListingState>
  found: string[]
}

/** Leter etter FINN-annonsens nøkkelinfo i innlimt tekst. */
export function parseFinnText(text: string): ParseResult {
  const patch: Partial<ListingState> = {}
  const found: string[] = []

  const pris = matchKr(text, /prisantydning/)
  const fellesgjeld = matchKr(text, /fellesgjeld/)
  const omk = matchKr(text, /omkostninger/)
  const totalpris = matchKr(text, /totalpris/)
  const felleskost = matchKr(text, /felleskost/)

  if (pris !== undefined && pris > 0) {
    patch.pris = pris
    found.push('prisantydning')
  } else if (totalpris !== undefined && totalpris > 0) {
    // Fall tilbake på totalpris minus det vi ellers fant
    patch.pris = Math.max(0, totalpris - (fellesgjeld ?? 0) - (omk ?? 0))
    found.push('pris (fra totalpris)')
  }
  if (fellesgjeld !== undefined) {
    patch.fellesgjeld = fellesgjeld
    found.push('fellesgjeld')
  }
  if (omk !== undefined && omk > 0) {
    patch.omkostninger = omk
    found.push('omkostninger')
  }
  if (felleskost !== undefined && felleskost > 0) {
    patch.felleskost = felleskost
    found.push('felleskostnader')
  }

  const areal = text.match(/(?:internt bruksareal|prim[æe]rrom|p-rom)\D{0,20}?([0-9]+(?:[.,][0-9])?)\s*m/i)
    ?? text.match(/bruksareal\D{0,20}?([0-9]+(?:[.,][0-9])?)\s*m/i)
  if (areal) {
    patch.areal = parseDec(areal[1])
    found.push('areal')
  }

  const byggeaar = text.match(/bygge?år\D{0,10}?((?:18|19|20)\d{2})/i)
  if (byggeaar) {
    patch.byggeaar = parseInt(byggeaar[1], 10)
    found.push('byggeår')
  }

  const soverom = text.match(/soverom\D{0,10}?(\d{1,2})/i)
  if (soverom) {
    patch.soverom = parseInt(soverom[1], 10)
    found.push('soverom')
  }

  const energi = text.match(/energimerk\w*\s*:?\s*([A-G])\b/i)
  if (energi) {
    patch.energi = energi[1].toUpperCase()
    found.push('energimerking')
  }

  const eieform = text.match(/eie(?:form|rform)\s*:?\s*([^\n]{1,40})/i)
  if (eieform) {
    patch.eieform = /andel|aksje|borettslag/i.test(eieform[1]) ? 'andel' : 'selveier'
    found.push('eieform')
  } else if (/borettslag/i.test(text)) {
    patch.eieform = 'andel'
    found.push('eieform (borettslag nevnt)')
  }

  const boligtype = text.match(/boligtype\s*:?\s*\n?\s*([A-Za-zÆØÅæøå/ -]{2,40})/i)
  if (boligtype) {
    patch.boligtype = boligtype[1].trim()
    found.push('boligtype')
  }

  return { patch, found }
}

/* ---------- Vurdering av boligen mot brukerens økonomi ---------- */

export type Verdict = 'innenfor' | 'trangt' | 'over'
export type FlagLevel = 'red' | 'warn' | 'info'

export interface Flag {
  level: FlagLevel
  title: string
  body: string
}

export interface ListingAnalysis {
  omk: number
  omkEstimated: boolean
  totalpris: number
  loan: number
  minEk: number
  ekOk: boolean
  totalDebt: number
  debtCap: number
  debtOk: boolean
  stressRate: number
  stressPayment: number
  stressMargin: number
  stressOk: boolean
  lanMnd: number
  strom: number
  monthly: number
  maxBud: number
  kvmPris: number
  fgShare: number
  verdict: Verdict
  flags: Flag[]
}

/** Anslått strøm/oppvarming per måned ut fra areal og energimerke. */
function estimateStrom(areal: number, energi: string): number {
  if (areal <= 0) return 0
  const kwhPerM2: Record<string, number> = { A: 95, B: 120, C: 145, D: 170, E: 200, F: 230, G: 260 }
  const kwh = kwhPerM2[energi] ?? 180
  return Math.round((areal * kwh * 1.5) / 12)
}

function buildFlags(L: ListingState, fgShare: number): Flag[] {
  const flags: Flag[] = []

  if (L.tg3 > 0) {
    flags.push({
      level: 'red',
      title: `${L.tg3} avvik med TG3 i tilstandsrapporten`,
      body: 'TG3 betyr store eller alvorlige avvik. Få en håndverker til å prise utbedringen før du byr, og trekk kostnaden fra det du er villig til å betale.',
    })
  }
  if (fgShare > 0.35) {
    flags.push({
      level: 'red',
      title: `Fellesgjelden utgjør ${Math.round(fgShare * 100)} % av totalprisen`,
      body: 'Svært høy fellesgjeld gjør deg rentefølsom. Sjekk om laget har IN-ordning, om det er avdragsfrihet som snart utløper (felleskostnadene kan hoppe kraftig), og om borettslaget er med i en sikringsordning.',
    })
  } else if (fgShare > 0.15) {
    flags.push({
      level: 'warn',
      title: `Fellesgjelden utgjør ${Math.round(fgShare * 100)} % av totalprisen`,
      body: 'Husk at renten på fellesgjelden ofte er flytende og betales via felleskostnadene. Sjekk vilkårene og om det er avdragsfri periode som utløper.',
    })
  }
  if (L.tg2 >= 5) {
    flags.push({
      level: 'warn',
      title: `${L.tg2} avvik med TG2`,
      body: 'Mange TG2-punkter betyr gjerne et samlet vedlikeholdsetterslep. Summer hva utbedringene koster — det er reelle kostnader de første årene.',
    })
  }
  if (['E', 'F', 'G'].includes(L.energi)) {
    flags.push({
      level: 'warn',
      title: `Energimerke ${L.energi} — høye strømkostnader`,
      body: 'Dårlig energimerke gir høyere strømregning og utelukker grønn boliglånsrente (krever ofte A/B). Sjekk hva etterisolering eller varmepumpe vil koste, og om Enova gir støtte.',
    })
  }
  if (L.byggeaar > 0 && L.byggeaar < 1960) {
    flags.push({
      level: 'warn',
      title: `Byggeår ${L.byggeaar} — typiske kostnadsbomber i eldre boliger`,
      body: 'Sjekk tilstandsrapporten nøye for elektrisk anlegg, drenering, tak og originale rør. Dette er de dyreste utbedringene og mangler ofte i prisantydningen.',
    })
  } else if (L.byggeaar >= 1960 && L.byggeaar < 1985) {
    flags.push({
      level: 'warn',
      title: `Byggeår ${L.byggeaar} — sjekk våtrom og avløp`,
      body: 'Boliger fra denne perioden har ofte originale avløpsrør (soilrør) og bad som nærmer seg slutten av levetiden. Et nytt bad koster fort 300–500 000 kr.',
    })
  } else if (L.byggeaar >= 1985 && L.byggeaar < 2005) {
    flags.push({
      level: 'info',
      title: `Byggeår ${L.byggeaar} — sjekk alder på bad og tak`,
      body: 'Bad og tak har 20–30 års levetid. Er de fra byggeåret, bør du budsjettere med utskifting i din eierperiode.',
    })
  }
  if (L.felleskost > 0 && L.areal > 0 && L.felleskost / L.areal > 55) {
    flags.push({
      level: 'warn',
      title: 'Høye felleskostnader per kvadratmeter',
      body: `${Math.round(L.felleskost / L.areal)} kr/m² per måned er høyt. Sjekk hva som inngår (varme? TV/internett? kommunale avgifter?) og om det skyldes nedbetaling av fellesgjeld.`,
    })
  }
  if (L.eieform === 'andel') {
    flags.push({
      level: 'info',
      title: 'Borettslag: gjør hjemmeleksen på laget',
      body: 'Les årsregnskapet og vedlikeholdsplanen. Store planlagte prosjekter (tak, rør, fasade) betyr økt fellesgjeld. Husk også at forkjøpsrett kan avgjøre budrunden.',
    })
  } else {
    flags.push({
      level: 'info',
      title: 'Selveier: dokumentavgift på 2,5 %',
      body: 'Staten tar 2,5 % av kjøpesummen i dokumentavgift. Den er regnet inn i totalprisen her, men husk at den øker hvis du byr over prisantydning.',
    })
  }

  const order: Record<FlagLevel, number> = { red: 0, warn: 1, info: 2 }
  return flags.sort((a, b) => order[a.level] - order[b.level])
}

/** Vurderer en konkret bolig mot utlånsforskriften og brukerens tall. */
export function analyzeListing(ci: ComputeInput, L: ListingState): ListingAnalysis | null {
  if (L.pris <= 0) return null

  const c = compute(ci)
  const gjeld = ci.studielan + ci.billan + ci.forbrukslan + ci.kredittramme

  // Omkostninger: dokumentavgift for selveier, ellers faste gebyrer (anslag)
  const dokFactor = L.eieform === 'selveier' ? 0.025 : 0
  const omkEstimated = L.omkostninger <= 0
  const omkFixed = omkEstimated
    ? L.eieform === 'selveier' ? 1_200 : 7_500
    : Math.max(0, L.omkostninger - dokFactor * L.pris)
  const omk = omkEstimated ? dokFactor * L.pris + omkFixed : L.omkostninger

  const totalpris = L.pris + L.fellesgjeld + omk
  const loan = Math.max(0, L.pris + omk - ci.egenkapital)

  // 1) Egenkapital: minst 10 % av boligverdi (pris + fellesgjeld) + omkostninger
  const minEk = 0.1 * (L.pris + L.fellesgjeld) + omk
  const ekOk = ci.egenkapital >= minEk

  // 2) Gjeldsgrad: nytt lån + fellesgjeld + eksisterende gjeld ≤ 5 × inntekt
  const totalDebt = loan + L.fellesgjeld + gjeld
  const debtCap = 5 * ci.income
  const debtOk = totalDebt <= debtCap

  // 3) Betjeningsevne: felleskostnadene dekker renter/avdrag på fellesgjelden,
  //    så vi stresstester bare det nye lånet og trekker felleskost fra rommet.
  const stressPayment = annuity(loan, c.stressRate, ci.aar)
  const stressMargin = c.avail - L.felleskost - stressPayment
  const stressOk = stressMargin >= 0

  // Månedskostnad ved dagens rente
  const lanMnd = annuity(loan, ci.rente, ci.aar)
  const strom = estimateStrom(L.areal, L.energi)
  const monthly = lanMnd + L.felleskost + strom

  // Maks budgrense: høyeste pris som fortsatt oppfyller alle tre kravene
  const ekMax = (ci.egenkapital - 0.1 * L.fellesgjeld - omkFixed) / (0.1 + dokFactor)
  const debtMax = (debtCap - gjeld - L.fellesgjeld + ci.egenkapital - omkFixed) / (1 + dokFactor)
  const pStress = principalFromPayment(Math.max(0, c.avail - L.felleskost), c.stressRate, ci.aar)
  const stressMax = (pStress + ci.egenkapital - omkFixed) / (1 + dokFactor)
  const maxBud = Math.max(0, Math.floor(Math.min(ekMax, debtMax, stressMax) / 10_000) * 10_000)

  const kvmPris = L.areal > 0 ? (L.pris + L.fellesgjeld) / L.areal : 0
  const fgShare = L.fellesgjeld > 0 ? L.fellesgjeld / (L.pris + L.fellesgjeld) : 0

  const verdict: Verdict = !ekOk || !debtOk || !stressOk
    ? 'over'
    : stressMargin < 2_500 || maxBud < L.pris * 1.03
      ? 'trangt'
      : 'innenfor'

  return {
    omk, omkEstimated, totalpris, loan, minEk, ekOk,
    totalDebt, debtCap, debtOk,
    stressRate: c.stressRate, stressPayment, stressMargin, stressOk,
    lanMnd, strom, monthly, maxBud, kvmPris, fgShare,
    verdict, flags: buildFlags(L, fgShare),
  }
}
