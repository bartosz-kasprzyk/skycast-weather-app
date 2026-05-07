import type { LucideIcon } from 'lucide-react'
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  Moon,
  Sun,
} from 'lucide-react'

export type WeatherCondition = {
  label: string
  Icon: LucideIcon
}

export function getConditionForWeatherCode(code: number): WeatherCondition {
  // Open-Meteo weather codes: https://open-meteo.com/en/docs
  if (code === 0) return { label: 'Clear', Icon: Sun }
  if (code === 1 || code === 2) return { label: 'Partly cloudy', Icon: Sun }
  if (code === 3) return { label: 'Overcast', Icon: Cloud }

  if (code === 45 || code === 48) return { label: 'Fog', Icon: CloudFog }

  if (code === 51 || code === 53 || code === 55) return { label: 'Drizzle', Icon: CloudDrizzle }
  if (code === 56 || code === 57) return { label: 'Freezing drizzle', Icon: CloudDrizzle }

  if (code === 61 || code === 63 || code === 65) return { label: 'Rain', Icon: CloudRain }
  if (code === 66 || code === 67) return { label: 'Freezing rain', Icon: CloudRain }

  if (code === 71 || code === 73 || code === 75) return { label: 'Snow', Icon: CloudSnow }
  if (code === 77) return { label: 'Snow grains', Icon: CloudSnow }

  if (code === 80 || code === 81 || code === 82) return { label: 'Showers', Icon: CloudRain }

  if (code === 85 || code === 86) return { label: 'Snow showers', Icon: CloudSnow }

  if (code === 95) return { label: 'Thunderstorm', Icon: CloudLightning }
  if (code === 96 || code === 99) return { label: 'Thunderstorm', Icon: CloudLightning }

  return { label: 'Unknown', Icon: Moon }
}

