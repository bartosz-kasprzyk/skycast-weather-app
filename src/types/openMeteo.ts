export interface GeocodingPlace {
  id: number
  name: string
  latitude: number
  longitude: number
  country: string
  admin1?: string
}

export interface GeocodingResponse {
  results?: GeocodingPlace[]
}

export interface ForecastCurrent {
  time: string
  temperature_2m: number
  relative_humidity_2m: number
  apparent_temperature: number
  dew_point_2m: number
  weather_code: number
  wind_speed_10m: number
  wind_direction_10m: number
  surface_pressure: number
}

export interface ForecastHourly {
  time: string[]
  temperature_2m: number[]
  weather_code: number[]
  visibility?: number[]
  uv_index?: number[]
}

export interface ForecastDaily {
  time: string[]
  weather_code: number[]
  temperature_2m_max: number[]
  temperature_2m_min: number[]
  sunrise?: string[]
  sunset?: string[]
  uv_index_max?: number[]
}

export interface ForecastResponse {
  latitude: number
  longitude: number
  utc_offset_seconds: number
  timezone: string
  current: ForecastCurrent
  hourly: ForecastHourly
  daily: ForecastDaily
}

