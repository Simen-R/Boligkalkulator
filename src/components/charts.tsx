import { useEffect, useRef } from 'react'
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js'
import type { Limit, LimitKey } from '../lib/finance'
import { kr, krShort } from '../lib/format'

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend)
Chart.defaults.font.family = "'Figtree', sans-serif"
Chart.defaults.font.size = 12

const GREEN = '#1E5B41'
const RED = '#B24127'
const MUTED = '#B9C4BB'

interface LimitsChartProps {
  limits: Limit[]
  neckKey: LimitKey
}

/** Horisontalt stolpediagram over de tre lånegrensene; flaskehalsen markeres i rødt. */
export function LimitsChart({ limits, neckKey }: LimitsChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<Chart<'bar'> | null>(null)

  useEffect(() => {
    const labels = limits.map((l) => l.label)
    const data = limits.map((l) => Math.round(l.value))
    const colors = limits.map((l) => (l.key === neckKey ? RED : GREEN))

    if (chartRef.current) {
      chartRef.current.data.labels = labels
      chartRef.current.data.datasets[0].data = data
      chartRef.current.data.datasets[0].backgroundColor = colors
      chartRef.current.update()
      return
    }
    chartRef.current = new Chart(canvasRef.current!, {
      type: 'bar',
      data: {
        labels,
        datasets: [{ data, backgroundColor: colors, borderRadius: 6, barPercentage: 0.62 }],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (x) => kr(x.raw as number) } },
        },
        scales: {
          x: { ticks: { callback: (v) => krShort(Number(v)), color: '#8A8F86' }, grid: { color: '#F0EEE6' } },
          y: { ticks: { color: '#4A5049' }, grid: { display: false } },
        },
      },
    })
  }, [limits, neckKey])

  useEffect(
    () => () => {
      chartRef.current?.destroy()
      chartRef.current = null
    },
    [],
  )

  return <canvas ref={canvasRef} />
}

interface ProjectionChartProps {
  now: [number, number, number]
  future: [number, number, number]
}

/** Grupperte stolper: kjøpesum, lån og egenkapital nå vs. om 12 måneder. */
export function ProjectionChart({ now, future }: ProjectionChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<Chart<'bar'> | null>(null)

  useEffect(() => {
    const nowData = now.map(Math.round)
    const futData = future.map(Math.round)
    if (chartRef.current) {
      chartRef.current.data.datasets[0].data = nowData
      chartRef.current.data.datasets[1].data = futData
      chartRef.current.update()
      return
    }
    chartRef.current = new Chart(canvasRef.current!, {
      type: 'bar',
      data: {
        labels: ['Kjøpesum', 'Lån', 'Egenkapital'],
        datasets: [
          { label: 'Nå', data: nowData, backgroundColor: MUTED, borderRadius: 5, barPercentage: 0.7, categoryPercentage: 0.62 },
          { label: 'Om 12 mnd', data: futData, backgroundColor: GREEN, borderRadius: 5, barPercentage: 0.7, categoryPercentage: 0.62 },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { boxWidth: 12, boxHeight: 12, usePointStyle: true, pointStyle: 'circle', color: '#4A5049' },
          },
          tooltip: { callbacks: { label: (x) => x.dataset.label + ': ' + kr(x.raw as number) } },
        },
        scales: {
          x: { ticks: { color: '#4A5049' }, grid: { display: false } },
          y: { ticks: { callback: (v) => krShort(Number(v)), color: '#8A8F86' }, grid: { color: '#F0EEE6' } },
        },
      },
    })
  }, [now, future])

  useEffect(
    () => () => {
      chartRef.current?.destroy()
      chartRef.current = null
    },
    [],
  )

  return <canvas ref={canvasRef} />
}
