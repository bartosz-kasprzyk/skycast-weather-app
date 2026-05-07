import type { ForecastResponse, GeocodingPlace, GeocodingResponse } from '../types/openMeteo'

const GEO_BASE = 'https://geocoding-api.open-meteo.com/v1/search'
const FORECAST_BASE = 'https://api.open-meteo.com/v1/forecast'

function toErrorMessage(e: unknown): string {
  return e instanceof Error ? e.message : 'Request failed.'
}

export async function geocodeCity(query: string): Promise<GeocodingPlace[]> {
  const url = new URL(GEO_BASE)
  url.searchParams.set('name', query)
  url.searchParams.set('count', '5')
  url.searchParams.set('language', 'en')
  url.searchParams.set('format', 'json')

  const res = await fetch(url)
  if (!res.ok) throw new Error(`Geocoding failed (${res.status}).`)
  const data = (await res.json()) as GeocodingResponse
  return data.results ?? []
}

export async function getForecast(input: {
  latitude: number
  longitude: number
  timezone: string
}): Promise<ForecastResponse> {
  const url = new URL(FORECAST_BASE)
  url.searchParams.set('latitude', String(input.latitude))
  url.searchParams.set('longitude', String(input.longitude))
  url.searchParams.set('timezone', input.timezone)

  url.searchParams.set(
    'current',
    [
      'temperature_2m',
      'relative_humidity_2m',
      'apparent_temperature',
      'dew_point_2m',
      'weather_code',
      'wind_speed_10m',
      'wind_direction_10m',
      'surface_pressure',
    ].join(','),
  )

  url.searchParams.set(
    'daily',
    ['weather_code', 'temperature_2m_max', 'temperature_2m_min', 'sunrise', 'sunset', 'uv_index_max'].join(
      ',',
    ),
  )
  url.searchParams.set('hourly', ['temperature_2m', 'weather_code', 'visibility', 'uv_index'].join(','))

  url.searchParams.set('forecast_days', '7')

  const res = await fetch(url)
  if (!res.ok) throw new Error(`Forecast failed (${res.status}).`)

  try {
    return (await res.json()) as ForecastResponse
  } catch (e) {
    throw new Error(toErrorMessage(e))
  }
}

