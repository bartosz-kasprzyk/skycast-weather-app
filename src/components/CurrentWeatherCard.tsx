import type { ForecastResponse } from '../types/openMeteo'
import { getConditionForWeatherCode } from '../lib/weatherCodes'

export function CurrentWeatherCard(props: {
  forecast: ForecastResponse | null
  isLoading?: boolean
}) {
  if (props.isLoading || !props.forecast) {
    return (
      <div className="flex items-end justify-between gap-6">
        <div className="space-y-3">
          <div className="h-12 w-40 rounded-lg bg-zinc-800/50" />
          <div className="h-4 w-32 rounded bg-zinc-800/40" />
          <div className="h-4 w-56 rounded bg-zinc-800/40" />
        </div>
      </div>
    )
  }

  const { current, daily } = props.forecast
  const condition = getConditionForWeatherCode(current.weather_code)

  const hi = daily.temperature_2m_max[0]
  const lo = daily.temperature_2m_min[0]

  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="flex items-end gap-4">
          <div className="text-7xl font-light tracking-tight sm:text-8xl">
            {Math.round(current.temperature_2m)}°
          </div>
          <div className="pb-3">
            <condition.Icon className="h-10 w-10 text-amber-300" />
          </div>
        </div>
        <div className="mt-2 text-sm font-semibold text-zinc-200">
          {condition.label}
        </div>
        <div className="mt-2 text-xs text-zinc-400">
          H: {Math.round(hi)}° &nbsp; L: {Math.round(lo)}° &nbsp; Feels like{' '}
          {Math.round(current.apparent_temperature)}°
        </div>
      </div>
    </div>
  )
}

