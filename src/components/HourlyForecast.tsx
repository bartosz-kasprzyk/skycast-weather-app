import type { ForecastResponse } from '../types/openMeteo'
import { getConditionForWeatherCode } from '../lib/weatherCodes'

function toHourKeyFromIsoLocal(isoLocal: string): number {
  // `YYYY-MM-DDTHH:mm` -> YYYYMMDDHH as number for easy comparisons
  const [datePart, timePart] = isoLocal.split('T')
  if (!datePart || !timePart) return Number.NEGATIVE_INFINITY
  const ymd = datePart.replaceAll('-', '')
  const hh = timePart.slice(0, 2)
  const key = Number(`${ymd}${hh}`)
  return Number.isFinite(key) ? key : Number.NEGATIVE_INFINITY
}

function formatHourLabelFromOpenMeteoLocalTime(isoLocal: string): string {
  // Open-Meteo returns local "wall clock" times like `2026-05-07T21:00`
  // (without an offset). Parsing via Date() would reinterpret in the user's
  // timezone and shift the hour. So we format from the string directly.
  const timePart = isoLocal.split('T')[1] ?? ''
  const hourStr = timePart.slice(0, 2)
  const hour = Number(hourStr)
  if (!Number.isFinite(hour)) return hourStr || isoLocal

  const suffix = hour >= 12 ? 'PM' : 'AM'
  const h12 = hour % 12 === 0 ? 12 : hour % 12
  return `${h12}${suffix}`
}

export function HourlyForecast(props: {
  forecast: ForecastResponse | null
  isLoading?: boolean
}) {
  if (props.isLoading || !props.forecast) {
    return (
      <div className="grid grid-cols-6 gap-3 sm:grid-cols-8 lg:grid-cols-12">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="glass-muted rounded-2xl p-3">
            <div className="h-3 w-10 rounded bg-zinc-800/50" />
            <div className="mt-3 h-6 w-6 rounded bg-zinc-800/40" />
            <div className="mt-3 h-4 w-10 rounded bg-zinc-800/50" />
          </div>
        ))}
      </div>
    )
  }

  const { hourly, utc_offset_seconds } = props.forecast

  // Anchor to the city's *actual current local hour*.
  // `hourly.time` is local wall-clock without offset, so we compute "now" in that
  // same wall-clock using the provided UTC offset.
  const cityNow = new Date(Date.now() + utc_offset_seconds * 1000)
  const y = cityNow.getUTCFullYear()
  const m = String(cityNow.getUTCMonth() + 1).padStart(2, '0')
  const d = String(cityNow.getUTCDate()).padStart(2, '0')
  const hh = String(cityNow.getUTCHours()).padStart(2, '0')
  const nowKey = Number(`${y}${m}${d}${hh}`)

  const startIdx = Math.max(
    0,
    hourly.time.findIndex((t) => toHourKeyFromIsoLocal(t) >= nowKey),
  )

  const items = Array.from({ length: 12 })
    .map((_, i) => startIdx + i)
    .filter((idx) => idx < hourly.time.length)

  return (
    <div className="grid grid-cols-6 gap-3 sm:grid-cols-8 lg:grid-cols-12">
      {items.map((idx, i) => {
        const time = hourly.time[idx]
        const temp = hourly.temperature_2m[idx]
        const code = hourly.weather_code[idx]
        const condition = getConditionForWeatherCode(code)
        return (
          <div
            key={time}
            className="glass-muted flex flex-col items-center rounded-2xl px-2 py-3 text-center"
          >
            <div className="text-[11px] font-semibold text-zinc-400">
              {i === 0 ? 'Now' : formatHourLabelFromOpenMeteoLocalTime(time)}
            </div>
            <condition.Icon className="mt-2 h-5 w-5 text-zinc-200" />
            <div className="mt-2 text-sm font-semibold text-zinc-100">
              {Math.round(temp)}°
            </div>
          </div>
        )
      })}
    </div>
  )
}

