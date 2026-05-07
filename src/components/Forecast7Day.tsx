import type { ForecastResponse } from '../types/openMeteo'
import { getConditionForWeatherCode } from '../lib/weatherCodes'
import { Moon, Sun } from 'lucide-react'

function formatDayLabel(iso: string, idx: number): string {
  if (idx === 0) return 'Today'
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { weekday: 'short' })
}

export function Forecast7Day(props: {
  forecast: ForecastResponse | null
  isLoading?: boolean
}) {
  if (props.isLoading || !props.forecast) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-2xl p-2">
            <div className="h-4 w-14 rounded bg-zinc-800/40" />
            <div className="h-5 w-5 rounded bg-zinc-800/40" />
            <div className="ml-auto flex items-center gap-3">
              <div className="h-4 w-8 rounded bg-zinc-800/40" />
              <div className="h-2 w-24 rounded bg-zinc-800/30" />
              <div className="h-4 w-8 rounded bg-zinc-800/40" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  const { daily } = props.forecast
  const max = Math.max(...daily.temperature_2m_max)
  const min = Math.min(...daily.temperature_2m_min)
  const range = Math.max(1, max - min)

  return (
    <div className="space-y-2">
      {daily.time.map((t, idx) => {
        const hi = daily.temperature_2m_max[idx]
        const lo = daily.temperature_2m_min[idx]
        const code = daily.weather_code[idx]
        const condition = getConditionForWeatherCode(code)

        const leftPct = ((lo - min) / range) * 100
        const widthPct = ((hi - lo) / range) * 100

        return (
          <div
            key={t}
            className="flex items-center gap-3 rounded-2xl px-2 py-2 text-sm"
          >
            <div className="w-16 text-xs font-semibold text-zinc-200">
              {formatDayLabel(t, idx)}
            </div>
            <condition.Icon className="h-4 w-4 text-zinc-300" />

            <div className="ml-auto flex items-center gap-3">
              <div className="flex w-12 items-center justify-end gap-1 text-right text-xs font-semibold text-zinc-500">
                <Moon className="h-3.5 w-3.5 text-zinc-500" />
                <span>{Math.round(lo)}°</span>
              </div>
              <div className="relative h-2 w-28 overflow-hidden rounded-full bg-zinc-800/60">
                <div
                  className="absolute top-0 h-full rounded-full bg-gradient-to-r from-sky-400 via-emerald-300 to-amber-300"
                  style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                />
              </div>
              <div className="flex w-12 items-center gap-1 text-xs font-semibold text-zinc-200">
                <Sun className="h-3.5 w-3.5 text-amber-300" />
                <span>{Math.round(hi)}°</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

