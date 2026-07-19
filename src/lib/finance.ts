// Rene finansfunksjoner — all beregningslogikk samlet her, uten UI-avhengigheter.

export interface DebtInput {
  studielan: number
  billan: number
  forbrukslan: number
  kredittramme: number
}

export interface ComputeInput extends DebtInput {
  income: number
  borrowers: 1 | 2
  egenkapital: number
  barn: number
  rente: number
  aar: number
}

export type LimitKey = 'debt' | 'ek' | 'stress'

export interface Limit {
  key: LimitKey
  label: string
  value: number
}

export interface ComputeResult {
  limits: Limit[]
  maxPurchase: number
  maxLoan: number
  monthly: number
  stressRate: number
  neck: Limit
  avail: number
  net: number
  living: number
  exServ: number
}

/** Terminbeløp per måned for annuitetslån. */
export function annuity(principal: number, ratePct: number, years: number): number {
  if (principal <= 0) return 0
  const r = ratePct / 1200
  const n = years * 12
  if (r === 0) return principal / n
  return (principal * r) / (1 - Math.pow(1 + r, -n))
}

/** Hvor stort lån et gitt terminbeløp kan betjene. */
export function principalFromPayment(pmt: number, ratePct: number, years: number): number {
  if (pmt <= 0) return 0
  const r = ratePct / 1200
  const n = years * 12
  if (r === 0) return pmt * n
  return (pmt * (1 - Math.pow(1 + r, -n))) / r
}

/** Grovt estimat på samlet netto månedsinntekt (trinnvis skattesats). */
export function netMonthly(income: number, borrowers: 1 | 2): number {
  const per = income / borrowers
  let rate: number
  if (per < 250_000) rate = 0.16
  else if (per < 500_000) rate = 0.25
  else if (per < 750_000) rate = 0.31
  else rate = 0.35
  return ((per * (1 - rate)) / 12) * borrowers
}

/** SIFO-nært estimat på levekostnader per måned. */
export function livingCost(borrowers: 1 | 2, barn: number): number {
  const adults = borrowers === 2 ? 22_000 : 13_500
  return adults + barn * 5_500
}

/** Månedlig betjening av eksisterende gjeld ved stressrente. */
export function debtService(debt: DebtInput, stressRate: number): number {
  return (
    annuity(debt.studielan, stressRate, 20) +
    annuity(debt.billan, stressRate, 5) +
    annuity(debt.forbrukslan, stressRate, 5) +
    annuity(debt.kredittramme, stressRate, 3)
  )
}

/** Tester tallene mot utlånsforskriftens tre krav og finner flaskehalsen. */
export function compute(s: ComputeInput): ComputeResult {
  const gjeld = s.studielan + s.billan + s.forbrukslan + s.kredittramme

  // 1) Gjeldsgrad: samlet gjeld maks 5 × bruttoinntekt
  const loanDebt = Math.max(0, 5 * s.income - gjeld)
  const pDebt = s.egenkapital + loanDebt

  // 2) Egenkapitalkrav: minst 10 % av kjøpesummen
  const pEK = s.egenkapital / 0.1

  // 3) Betjeningsevne: tåle rente + 3 pp, minst 7 %
  const stressRate = Math.max(s.rente + 3, 7)
  const net = netMonthly(s.income, s.borrowers)
  const living = livingCost(s.borrowers, s.barn)
  const exServ = debtService(s, stressRate)
  const avail = Math.max(0, net - living - exServ)
  const loanStress = principalFromPayment(avail, stressRate, s.aar)
  const pStress = s.egenkapital + loanStress

  const limits: Limit[] = [
    { key: 'debt', label: 'Gjeldsgrad (5× inntekt)', value: Math.max(0, pDebt) },
    { key: 'ek', label: 'Egenkapital (10 %)', value: Math.max(0, pEK) },
    { key: 'stress', label: 'Betjeningsevne', value: Math.max(0, pStress) },
  ]
  const maxPurchase = Math.max(0, Math.min(pDebt, pEK, pStress))
  const neck = limits.reduce((a, b) => (b.value < a.value ? b : a))
  const maxLoan = Math.max(0, maxPurchase - s.egenkapital)
  const monthly = annuity(maxLoan, s.rente, s.aar)

  return { limits, maxPurchase, maxLoan, monthly, stressRate, neck, avail, net, living, exServ }
}
