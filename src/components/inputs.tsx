import type { ChangeEvent } from 'react'

function parseNum(e: ChangeEvent<HTMLInputElement>): number {
  const n = parseFloat(e.target.value)
  return Number.isNaN(n) ? 0 : n
}

export interface SliderRange {
  min: number
  max: number
  step?: number
}

interface SliderProps extends SliderRange {
  value: number
  onChange: (n: number) => void
}

/** Frittstående slider i feltstil — brukes under tallfelt for å dra verdien opp/ned. */
export function Slider({ value, onChange, min, max, step = 1 }: SliderProps) {
  return (
    <input
      type="range"
      className="field-slider"
      min={min}
      max={max}
      step={step}
      value={Math.min(Math.max(value, min), max)}
      onChange={(e) => onChange(parseNum(e))}
    />
  )
}

interface MoneyInputProps {
  value: number
  onChange: (n: number) => void
  step?: number
  size?: 'lg' | 'md' | 'sm'
  suffix?: string
  alignRight?: boolean
  /** Vis en slider under feltet med dette området. Verdier utenfor kan fortsatt skrives inn. */
  slider?: SliderRange
}

/** Tallfelt med enhet (kr/%) i høyre kant, valgfritt med slider under. */
export function MoneyInput({ value, onChange, step = 10000, size = 'lg', suffix = 'kr', alignRight = false, slider }: MoneyInputProps) {
  return (
    <div className={`money-input money-input--${size}`}>
      <div className="money-input__box">
        <input
          type="number"
          value={value}
          step={step}
          onChange={(e) => onChange(parseNum(e))}
          style={alignRight ? { textAlign: 'right' } : undefined}
        />
        {suffix && <span>{suffix}</span>}
      </div>
      {slider && <Slider value={value} onChange={onChange} min={slider.min} max={slider.max} step={slider.step ?? step} />}
    </div>
  )
}

interface SliderRowProps {
  label: string
  valueLabel: string
  min: number
  max: number
  step: number
  value: number
  onChange: (n: number) => void
  minLabel?: string
  maxLabel?: string
}

/** Slider med etikett og verdi over, ev. min/maks under. */
export function SliderRow({ label, valueLabel, min, max, step, value, onChange, minLabel, maxLabel }: SliderRowProps) {
  return (
    <div className="slider-row">
      <div className="slider-row__head">
        <label>{label}</label>
        <span>{valueLabel}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseNum(e))} />
      {minLabel && maxLabel && (
        <div className="slider-row__scale">
          <span>{minLabel}</span>
          <span>{maxLabel}</span>
        </div>
      )}
    </div>
  )
}

interface SegmentedProps<T extends string | number> {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
  variant?: 'pill' | 'outline'
}

/** Segmentert knappevelger (f.eks. 1/2 personer, samlet/per person). */
export function Segmented<T extends string | number>({ options, value, onChange, variant = 'pill' }: SegmentedProps<T>) {
  return (
    <div className={`segmented segmented--${variant}`}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          className={o.value === value ? 'is-active' : ''}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
