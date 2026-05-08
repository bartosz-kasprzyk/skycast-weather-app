import { useEffect, useMemo, useState } from "react";
import { Cloud, MapPin } from "lucide-react";
import { geocodeCity, getForecast } from "./lib/openMeteo";
import type { ForecastResponse, GeocodingPlace } from "./types/openMeteo";
import { SearchBar } from "./components/SearchBar.tsx";
import { CurrentWeatherCard } from "./components/CurrentWeatherCard.tsx";
import { HourlyForecast } from "./components/HourlyForecast.tsx";
import { Forecast7Day } from "./components/Forecast7Day.tsx";
import { MetricCard } from "./components/MetricCard.tsx";
import { getConditionForWeatherCode } from "./lib/weatherCodes.ts";
import AuroraBackground from "./components/AuroraBackground/AuroraBackground.tsx";

const DEFAULT_PLACE: GeocodingPlace = {
  id: 5391959,
  name: "San Francisco",
  latitude: 37.7749,
  longitude: -122.4194,
  country: "United States",
  admin1: "California",
};

const FORECAST_REQUEST_VERSION = 2;

function formatLocalTimeFromOpenMeteo(isoLocal?: string): string {
  if (!isoLocal) return "\u2014";
  const timePart = isoLocal.split("T")[1] ?? "";
  const hh = Number(timePart.slice(0, 2));
  const mm = timePart.slice(3, 5);
  if (!Number.isFinite(hh)) return isoLocal;
  const suffix = hh >= 12 ? "PM" : "AM";
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${h12}:${mm} ${suffix}`;
}

function getCityNowHourlyIndex(forecast: ForecastResponse): number {
  const cityNow = new Date(Date.now() + forecast.utc_offset_seconds * 1000);
  const y = cityNow.getUTCFullYear();
  const m = String(cityNow.getUTCMonth() + 1).padStart(2, "0");
  const d = String(cityNow.getUTCDate()).padStart(2, "0");
  const hh = String(cityNow.getUTCHours()).padStart(2, "0");
  const nowKey = Number(`${y}${m}${d}${hh}`);

  const idx = forecast.hourly.time.findIndex((t) => {
    const [dp, tp] = t.split("T");
    if (!dp || !tp) return false;
    const key = Number(`${dp.replaceAll("-", "")}${tp.slice(0, 2)}`);
    return Number.isFinite(key) && key >= nowKey;
  });
  return Math.max(0, idx);
}

export default function App() {
  const [place, setPlace] = useState<GeocodingPlace>(DEFAULT_PLACE);
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getForecast({
          latitude: place.latitude,
          longitude: place.longitude,
          timezone: "auto",
        });
        if (!cancelled) setForecast(data);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to load weather.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [place.latitude, place.longitude, FORECAST_REQUEST_VERSION]);

  const title = useMemo(() => {
    const bits = [place.name, place.admin1].filter(Boolean);
    return bits.join(", ");
  }, [place.admin1, place.name]);

  const current = forecast?.current;
  const condition = current
    ? getConditionForWeatherCode(current.weather_code)
    : null;
  const nowHourlyIdx = forecast ? getCityNowHourlyIndex(forecast) : 0;
  const visibilityM = forecast?.hourly.visibility?.[nowHourlyIdx];
  const visibilityKm =
    typeof visibilityM === "number"
      ? `${Math.round(visibilityM / 1000)} km`
      : "\u2014";
  const uv = forecast?.hourly.uv_index?.[nowHourlyIdx];
  const uvLabel = typeof uv === "number" ? String(Math.round(uv)) : "\u2014";
  const uvHint =
    typeof uv === "number"
      ? uv >= 8
        ? "Very high"
        : uv >= 6
          ? "High"
          : uv >= 3
            ? "Moderate"
            : "Low"
      : undefined;
  const sunrise = formatLocalTimeFromOpenMeteo(forecast?.daily.sunrise?.[0]);
  const sunset = formatLocalTimeFromOpenMeteo(forecast?.daily.sunset?.[0]);

  async function fetchOptions(query: string) {
    const q = query.trim();
    if (!q) return [];
    try {
      return await geocodeCity(q);
    } catch {
      return [];
    }
  }

  return (
    <div className="relative min-h-screen text-zinc-100">
      <AuroraBackground />
      <div className="relative z-10 flex min-h-screen flex-col">
        <div
          className="glass sticky top-0 z-20 !border-x-0 !border-t-0"
          style={{
            backgroundColor: "rgba(255,255,255,0.08)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4">
            <div className="flex shrink-0 items-center gap-2">
              <img width="25px" src="/public/icon192.png" />
              <span className="text-sm font-semibold tracking-wide text-zinc-100">
                SkyCast
              </span>
            </div>
            <SearchBar
              placeholder="Search for a city..."
              isLoading={isLoading}
              debounceMs={250}
              fetchOptions={fetchOptions}
              onSelect={(p) => {
                setError(null);
                setPlace(p);
              }}
            />
          </div>
        </div>

        {/* Main content */}
        <main className="mx-auto w-full max-w-6xl px-4 pb-10 pt-6">
          {error ? (
            <div className="glass mb-6 rounded-2xl p-4 text-sm text-rose-200">
              {error}
            </div>
          ) : null}

          <div className="space-y-6">
            <section className="glass relative overflow-hidden rounded-3xl p-6">
              <div className="pointer-events-none absolute right-8 top-1/2 -translate-y-1/2 opacity-30">
                {condition?.Icon ? (
                  <condition.Icon className="h-28 w-28 text-sky-400" />
                ) : (
                  <Cloud className="h-28 w-28 text-sky-400" />
                )}
              </div>
              <div className="mb-5 flex items-center gap-2 text-sm text-zinc-300">
                <MapPin className="h-4 w-4" />
                <span>{title}</span>
              </div>

              <CurrentWeatherCard
                forecast={forecast}
                isLoading={!forecast || isLoading}
              />
            </section>

            <section className="glass rounded-3xl p-5">
              <div className="mb-3 text-xs font-semibold tracking-widest text-zinc-400">
                HOURLY FORECAST
              </div>
              <HourlyForecast
                forecast={forecast}
                isLoading={!forecast || isLoading}
              />
            </section>

            <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="glass rounded-3xl p-5 lg:col-span-5">
                <div className="mb-3 text-xs font-semibold tracking-widest text-zinc-400">
                  7-DAY FORECAST
                </div>
                <Forecast7Day
                  forecast={forecast}
                  isLoading={!forecast || isLoading}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 lg:col-span-7 lg:grid-cols-4">
                <MetricCard
                  label="Wind"
                  value={
                    current
                      ? `${Math.round(current.wind_speed_10m)} km/h`
                      : "\u2014"
                  }
                  hint={
                    current
                      ? `${Math.round(current.wind_direction_10m)}°`
                      : undefined
                  }
                  icon="wind"
                />
                <MetricCard
                  label="Humidity"
                  value={
                    current
                      ? `${Math.round(current.relative_humidity_2m)}%`
                      : "\u2014"
                  }
                  hint={
                    current
                      ? `Dew point: ${Math.round(current.dew_point_2m)}°`
                      : undefined
                  }
                  icon="humidity"
                />
                <MetricCard
                  label="Visibility"
                  value={visibilityKm}
                  hint={visibilityM ? "Clear conditions" : undefined}
                  icon="visibility"
                />
                <MetricCard
                  label="Pressure"
                  value={
                    current
                      ? `${Math.round(current.surface_pressure)} hPa`
                      : "\u2014"
                  }
                  hint={current ? "Normal" : undefined}
                  icon="pressure"
                />
                <MetricCard
                  label="UV Index"
                  value={uvLabel}
                  hint={uvHint}
                  icon="uv"
                />
                <MetricCard
                  label="Feels like"
                  value={
                    current
                      ? `${Math.round(current.apparent_temperature)}°`
                      : "\u2014"
                  }
                  hint={condition?.label}
                  icon="feelsLike"
                />
                <MetricCard
                  label="Sunrise"
                  value={sunrise}
                  hint={forecast ? undefined : undefined}
                  icon="sunrise"
                />
                <MetricCard
                  label="Sunset"
                  value={sunset}
                  hint={forecast ? undefined : undefined}
                  icon="sunset"
                />
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
