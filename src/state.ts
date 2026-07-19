import { useCallback, useState } from 'react'

export type Tab = 'kalkulator' | 'regler' | 'banker' | 'bsu' | 'plan'
export type DebtMode = 'samlet' | 'person'

export interface AppState {
  borrowers: 1 | 2
  income1: number
  income2: number
  egenkapital: number
  sparing: number
  barn: number
  debtMode: DebtMode
  studielan: number
  billan: number
  forbrukslan: number
  kredittramme: number
  studielan2: number
  billan2: number
  forbrukslan2: number
  kredittramme2: number
  rente: number
  aar: number
  lonnsvekst: number
  nedgjeld: number
  byLan: number
  byOld: number
  byNew: number
  byAar: number
  checked: Record<string, boolean>
}

export const DEFAULT_STATE: AppState = {
  borrowers: 2,
  income1: 550_000,
  income2: 550_000,
  egenkapital: 400_000,
  sparing: 8_000,
  barn: 0,
  debtMode: 'samlet',
  studielan: 300_000,
  billan: 0,
  forbrukslan: 0,
  kredittramme: 20_000,
  studielan2: 0,
  billan2: 0,
  forbrukslan2: 0,
  kredittramme2: 0,
  rente: 5.5,
  aar: 30,
  lonnsvekst: 3,
  nedgjeld: 0,
  byLan: 3_000_000,
  byOld: 5.9,
  byNew: 5.1,
  byAar: 25,
  checked: {},
}

const STORAGE_KEY = 'bolig_calc_v3'

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_STATE
    return { ...DEFAULT_STATE, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_STATE
  }
}

/** App-tilstand som lagres automatisk i localStorage. */
export function useAppState(): [AppState, (patch: Partial<AppState>) => void] {
  const [state, setState] = useState<AppState>(loadState)
  const update = useCallback((patch: Partial<AppState>) => {
    setState((prev) => {
      const next = { ...prev, ...patch }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        // full storage er ikke kritisk
      }
      return next
    })
  }, [])
  return [state, update]
}

/** Slår sammen per-person-gjeld til samlede tall for beregning. */
export function effectiveDebt(s: AppState) {
  const perPerson = s.borrowers === 2 && s.debtMode === 'person'
  return {
    studielan: perPerson ? s.studielan + s.studielan2 : s.studielan,
    billan: perPerson ? s.billan + s.billan2 : s.billan,
    forbrukslan: perPerson ? s.forbrukslan + s.forbrukslan2 : s.forbrukslan,
    kredittramme: perPerson ? s.kredittramme + s.kredittramme2 : s.kredittramme,
  }
}

export function totalIncome(s: AppState): number {
  return s.borrowers === 2 ? s.income1 + s.income2 : s.income1
}
