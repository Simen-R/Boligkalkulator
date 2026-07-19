export function fmt(n: number): string {
  return Math.round(n).toLocaleString('nb-NO')
}

export function kr(n: number): string {
  return fmt(n) + ' kr'
}

export function krShort(n: number): string {
  if (n >= 1e6) {
    return (n / 1e6).toLocaleString('nb-NO', { maximumFractionDigits: 2 }) + ' mill.'
  }
  return kr(n)
}

export function pct(n: number): string {
  return n.toLocaleString('nb-NO') + ' %'
}
