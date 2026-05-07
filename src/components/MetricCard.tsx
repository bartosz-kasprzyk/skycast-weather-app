import {
  Droplets,
  Eye,
  Gauge,
  Sunrise,
  Sunset,
  Thermometer,
  Wind,
  type LucideIcon,
} from 'lucide-react'

type MetricIconName =
  | 'wind'
  | 'humidity'
  | 'pressure'
  | 'feelsLike'
  | 'visibility'
  | 'uv'
  | 'sunrise'
  | 'sunset'

const ICONS: Record<MetricIconName, LucideIcon> = {
  wind: Wind,
  humidity: Droplets,
  pressure: Gauge,
  feelsLike: Thermometer,
  visibility: Eye,
  uv: Gauge,
  sunrise: Sunrise,
  sunset: Sunset,
}

export function MetricCard(props: {
  label: string
  value: string
  hint?: string
  icon: MetricIconName
}) {
  const Icon = ICONS[props.icon]
  return (
    <div className="glass rounded-3xl px-4 py-4">
      <div className="flex items-center gap-2 text-xs font-semibold tracking-widest text-zinc-400">
        <Icon className="h-4 w-4" />
        <span>{props.label.toUpperCase()}</span>
      </div>
      <div className="mt-5 text-xl font-semibold text-zinc-100">{props.value}</div>
      {props.hint ? (
        <div className="mt-2 text-xs text-zinc-500">{props.hint}</div>
      ) : null}
    </div>
  )
}

