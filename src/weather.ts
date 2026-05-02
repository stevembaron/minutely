import type { Condition, MinuteForecast, LocationInfo, ScenarioKey, CurrentConditions, HourlyForecast } from './types';

// ── COLOR / STYLE SYSTEM ───────────────────────────────────────────────────
export const CONDITION_STYLE: Record<Condition, { barColor: string; accent: string; bg: string; bgDark: string; textAccent: string; label: string }> = {
  clear:    { barColor: '#3d9e5f', accent: '#2e7d4a', bg: '#edf8f2', bgDark: '#0b1a10', textAccent: '#256038', label: 'Clear'    },
  clearing: { barColor: '#8db840', accent: '#6e9630', bg: '#f3f8eb', bgDark: '#0e1b0b', textAccent: '#4f6e22', label: 'Clearing' },
  drizzle:  { barColor: '#d4a017', accent: '#b88512', bg: '#fbf6e8', bgDark: '#1a1408', textAccent: '#8a620d', label: 'Drizzle'  },
  rain:     { barColor: '#c94f2a', accent: '#a83e1e', bg: '#f2eceb', bgDark: '#160d0d', textAccent: '#8a2e10', label: 'Rain'     },
  flurries: { barColor: '#9eb5cd', accent: '#7592b0', bg: '#f0f5fa', bgDark: '#0f1620', textAccent: '#4d6e8e', label: 'Flurries' },
  snow:     { barColor: '#6b8caf', accent: '#4a6e94', bg: '#eaf1f7', bgDark: '#0d1521', textAccent: '#2d5076', label: 'Snow'     },
  sleet:    { barColor: '#8b7da8', accent: '#6e6188', bg: '#f1eef5', bgDark: '#131019', textAccent: '#4f4566', label: 'Sleet'    },
};

export function getStyle(condition: Condition, precip: number) {
  if (condition === 'rain' && precip > 0.65) {
    return { ...CONDITION_STYLE.rain, barColor: '#b03020', label: 'Heavy Rain' };
  }
  if (condition === 'snow' && precip > 0.65) {
    return { ...CONDITION_STYLE.snow, barColor: '#3d5d80', label: 'Heavy Snow' };
  }
  return CONDITION_STYLE[condition] ?? CONDITION_STYLE.clear;
}

// ── TIME HELPERS ───────────────────────────────────────────────────────────
export const BASE_TIME = (() => { const d = new Date(); d.setSeconds(0, 0); return d; })();

export function timeLabel(offsetMin: number, short = false): string {
  const d = new Date(BASE_TIME.getTime() + offsetMin * 60000);
  const h = d.getHours() % 12 || 12;
  const m = d.getMinutes().toString().padStart(2, '0');
  const ap = d.getHours() < 12 ? 'am' : 'pm';
  return short ? `${h}:${m}` : `${h}:${m}${ap}`;
}

// ── MOCK SCENARIOS ─────────────────────────────────────────────────────────
export const SCENARIOS: Record<ScenarioKey, { label: string; desc: string; build: () => MinuteForecast[] }> = {
  rain_clearing: {
    label: 'Rain clearing',
    desc: 'Raining now, clears at ~22 min',
    build: () => Array.from({ length: 60 }, (_, i) => {
      let precip: number, condition: Condition;
      if (i < 5)       { precip = 0.72 + Math.random() * 0.18; condition = 'rain'; }
      else if (i < 13) { precip = 0.45 + Math.random() * 0.20; condition = 'rain'; }
      else if (i < 23) { precip = 0.18 + Math.random() * 0.14; condition = 'drizzle'; }
      else if (i < 29) { precip = 0.04 + Math.random() * 0.05; condition = 'clearing'; }
      else             { precip = 0; condition = 'clear'; }
      return { minute: i, precip, condition, temp: 58 + i * 0.08 + (Math.random() - 0.5) * 0.4 };
    }),
  },
  all_clear: {
    label: 'All clear',
    desc: 'Sunny skies the whole hour',
    build: () => Array.from({ length: 60 }, (_, i) => ({
      minute: i, precip: 0, condition: 'clear' as Condition,
      temp: 68 + i * 0.05 + (Math.random() - 0.5) * 0.3,
    })),
  },
  storm_incoming: {
    label: 'Storm incoming',
    desc: 'Clear now, heavy rain by min 20',
    build: () => Array.from({ length: 60 }, (_, i) => {
      let precip: number, condition: Condition;
      if (i < 12)      { precip = 0; condition = 'clear'; }
      else if (i < 18) { precip = 0.05 + Math.random() * 0.08; condition = 'clearing'; }
      else if (i < 28) { precip = 0.3 + Math.random() * 0.2; condition = 'rain'; }
      else             { precip = 0.75 + Math.random() * 0.2; condition = 'rain'; }
      return { minute: i, precip, condition, temp: 62 - i * 0.1 + (Math.random() - 0.5) * 0.3 };
    }),
  },
  steady_rain: {
    label: 'Steady rain',
    desc: 'Rain throughout the hour',
    build: () => Array.from({ length: 60 }, (_, i) => ({
      minute: i, precip: 0.55 + Math.random() * 0.3, condition: 'rain' as Condition,
      temp: 52 + i * 0.05 + (Math.random() - 0.5) * 0.3,
    })),
  },
  drizzle: {
    label: 'Drizzle',
    desc: 'Light drizzle all hour',
    build: () => Array.from({ length: 60 }, (_, i) => ({
      minute: i, precip: 0.1 + Math.random() * 0.18, condition: 'drizzle' as Condition,
      temp: 56 + i * 0.06 + (Math.random() - 0.5) * 0.3,
    })),
  },
  snow_clearing: {
    label: 'Snow clearing',
    desc: 'Snowing now, eases at ~25 min',
    build: () => Array.from({ length: 60 }, (_, i) => {
      let precip: number, condition: Condition;
      if (i < 8)        { precip = 0.55 + Math.random() * 0.2; condition = 'snow'; }
      else if (i < 18)  { precip = 0.32 + Math.random() * 0.18; condition = 'snow'; }
      else if (i < 28)  { precip = 0.15 + Math.random() * 0.12; condition = 'flurries'; }
      else if (i < 35)  { precip = 0.04 + Math.random() * 0.05; condition = 'clearing'; }
      else              { precip = 0; condition = 'clear'; }
      return { minute: i, precip, condition, temp: 28 + i * 0.05 + (Math.random() - 0.5) * 0.3 };
    }),
  },
  snowstorm: {
    label: 'Snowstorm',
    desc: 'Heavy snow all hour',
    build: () => Array.from({ length: 60 }, (_, i) => ({
      minute: i, precip: 0.7 + Math.random() * 0.25, condition: 'snow' as Condition,
      temp: 22 + i * 0.04 + (Math.random() - 0.5) * 0.3,
    })),
  },
  sleet_mix: {
    label: 'Sleet / wintry mix',
    desc: 'Mixed sleet and snow',
    build: () => Array.from({ length: 60 }, (_, i) => {
      let condition: Condition;
      const r = (i + Math.floor(Math.random() * 3)) % 7;
      if (r < 3)      condition = 'sleet';
      else if (r < 5) condition = 'flurries';
      else            condition = 'snow';
      return { minute: i, precip: 0.3 + Math.random() * 0.25, condition, temp: 33 + (Math.random() - 0.5) * 0.4 };
    }),
  },
};

export function buildForecast(key: ScenarioKey = 'rain_clearing'): MinuteForecast[] {
  return SCENARIOS[key].build();
}

// ── PIRATE WEATHER API ─────────────────────────────────────────────────────
const API_KEY = 'pPrBGDNcJMvdc6hKoEMc6sl13R44I0UE';

function mmToIntensity(mmPerHour: number): number {
  return Math.min(1, mmPerHour / 10);
}

// Pirate Weather precipType: 'rain' | 'snow' | 'sleet' | undefined
function intensityToCondition(mmPerHour: number, precipType?: string): Condition {
  if (mmPerHour < 0.1) return 'clear';
  if (precipType === 'snow') {
    // Snow mm/hr is liquid-equivalent; ~1 mm liquid ≈ 10mm of snow
    return mmPerHour < 1.0 ? 'flurries' : 'snow';
  }
  if (precipType === 'sleet') return 'sleet';
  return mmPerHour < 2.5 ? 'drizzle' : 'rain';
}

// Map Pirate Weather / Dark Sky icon strings to our Condition type
function iconToCondition(icon: string, precipMm: number, precipType?: string): Condition {
  if (icon === 'snow')                              return precipMm < 1.0 ? 'flurries' : 'snow';
  if (icon === 'sleet')                             return 'sleet';
  if (icon === 'rain')                              return precipMm < 2.5 ? 'drizzle' : 'rain';
  if (icon === 'cloudy' || icon === 'fog')          return 'clearing';
  if (icon === 'partly-cloudy-day' || icon === 'partly-cloudy-night') return 'clearing';
  // No icon hint — fall back to precipType + intensity
  return intensityToCondition(precipMm, precipType);
}

function celsiusToFahrenheit(c: number): number {
  return c * 9 / 5 + 32;
}

export interface LiveData {
  forecast: MinuteForecast[];
  current: CurrentConditions;
  hourly: HourlyForecast[];
  sunriseTime?: Date;
  sunsetTime?: Date;
}

function kphToMph(kph: number): number { return kph * 0.621371; }
function kmToMiles(km: number): number { return km * 0.621371; }

export async function fetchLiveData(lat: number, lng: number): Promise<LiveData | null> {
  try {
    const url = `https://api.pirateweather.net/forecast/${API_KEY}/${lat},${lng}?exclude=alerts&units=ca`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();

    const c = data.currently ?? {};
    const currentTempC: number = c.temperature ?? 15;
    const currentTempF = celsiusToFahrenheit(currentTempC);
    const currentIcon: string = c.icon ?? '';
    const currentPrecip: number = c.precipIntensity ?? 0;
    const currentPrecipType: string | undefined = c.precipType;
    const currentCondition = iconToCondition(currentIcon, currentPrecip, currentPrecipType);

    const daily0 = data.daily?.data?.[0] ?? {};
    const current: CurrentConditions = {
      windSpeed:   Math.round(kphToMph(c.windSpeed ?? 0)),
      windGust:    c.windGust != null ? Math.round(kphToMph(c.windGust)) : undefined,
      windBearing: c.windBearing != null ? Math.round(c.windBearing) : undefined,
      humidity:    Math.round((c.humidity ?? 0.5) * 100),
      uvIndex:     Math.round(c.uvIndex ?? 0),
      visibility:  Math.round(kmToMiles(c.visibility ?? 16)),
      feelsLike:   Math.round(celsiusToFahrenheit(c.apparentTemperature ?? currentTempC)),
      highTemp:    daily0.temperatureHigh != null ? Math.round(celsiusToFahrenheit(daily0.temperatureHigh)) : undefined,
      lowTemp:     daily0.temperatureLow  != null ? Math.round(celsiusToFahrenheit(daily0.temperatureLow))  : undefined,
      pressure:    c.pressure != null ? Math.round(c.pressure) : undefined,
      // units=ca returns nearestStormDistance in km; convert to miles for internal storage
      nearestStormDistance: c.nearestStormDistance != null ? Math.round(kmToMiles(c.nearestStormDistance)) : undefined,
      nearestStormBearing:  c.nearestStormBearing  != null ? Math.round(c.nearestStormBearing)  : undefined,
    };

    const sunriseTime = daily0.sunriseTime ? new Date(daily0.sunriseTime * 1000) : undefined;
    const sunsetTime  = daily0.sunsetTime  ? new Date(daily0.sunsetTime  * 1000) : undefined;

    let forecast: MinuteForecast[] | null = null;

    if (data.minutely?.data && data.minutely.data.length >= 60) {
      forecast = data.minutely.data.slice(0, 60).map((m: { precipIntensity: number; precipType?: string }, i: number) => {
        const mmPerHour = m.precipIntensity ?? 0;
        // Minutely points often lack precipType; inherit current's type as a sensible fallback
        const ptype = m.precipType ?? currentPrecipType;
        const condition = i === 0 ? currentCondition : intensityToCondition(mmPerHour, ptype);
        return { minute: i, precip: Math.max(mmToIntensity(mmPerHour), i === 0 ? mmToIntensity(currentPrecip) : 0), condition, temp: currentTempF + i * 0.05 };
      });
    } else if (data.hourly?.data && data.hourly.data.length >= 2) {
      const h0 = data.hourly.data[0];
      const h1 = data.hourly.data[1];
      const h0Type: string | undefined = h0.precipType ?? currentPrecipType;
      forecast = Array.from({ length: 60 }, (_, i) => {
        const t = i / 60;
        const precip = (h0.precipIntensity ?? 0) * (1 - t) + (h1.precipIntensity ?? 0) * t;
        const tempC = (h0.temperature ?? currentTempC) * (1 - t) + (h1.temperature ?? currentTempC) * t;
        return { minute: i, precip: mmToIntensity(i === 0 ? Math.max(precip, currentPrecip) : precip), condition: i === 0 ? currentCondition : intensityToCondition(precip, h0Type), temp: celsiusToFahrenheit(tempC) };
      });
    }

    if (!forecast) return null;

    const hourly: HourlyForecast[] = (data.hourly?.data ?? []).slice(0, 24).map((h: {
      time: number; icon?: string; temperature?: number;
      precipIntensity?: number; precipProbability?: number; precipType?: string;
    }) => {
      const tempF = celsiusToFahrenheit(h.temperature ?? currentTempC);
      const precipMm = h.precipIntensity ?? 0;
      return {
        time: new Date((h.time ?? 0) * 1000),
        condition: iconToCondition(h.icon ?? '', precipMm, h.precipType),
        precip: mmToIntensity(precipMm),
        temp: tempF,
        precipProb: Math.round((h.precipProbability ?? 0) * 100),
      };
    });

    return { forecast, current, hourly, sunriseTime, sunsetTime };
  } catch (err) {
    console.error('Pirate Weather error:', err);
    return null;
  }
}

// Fetch the temperature at this exact wall-clock time on the previous day
// (uses Pirate Weather's time-machine endpoint).
export async function fetchYesterdayTemp(lat: number, lng: number): Promise<number | null> {
  try {
    const ts = Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000);
    const url = `https://api.pirateweather.net/forecast/${API_KEY}/${lat},${lng},${ts}?exclude=alerts,minutely,daily&units=ca`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const tempC = data.currently?.temperature;
    if (tempC == null) return null;
    return celsiusToFahrenheit(tempC);
  } catch (err) {
    console.error('Pirate Weather time-machine error:', err);
    return null;
  }
}

// ── GEOCODING ─────────────────────────────────────────────────────────────
export interface GeoResult {
  name: string;
  admin1: string;   // state / region
  country: string;
  lat: number;
  lng: number;
}

export async function searchLocations(query: string): Promise<GeoResult[]> {
  if (!query.trim()) return [];
  try {
    // Nominatim (OpenStreetMap) — CORS-enabled, free, no key required
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=8&addressdetails=1&accept-language=en`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: NominatimResult[] = await res.json();
    return data
      .filter(r => r.addresstype && ['city','town','village','municipality','suburb','county'].includes(r.addresstype))
      .map(r => ({
        name: r.name || r.address?.city || r.address?.town || r.address?.village || r.display_name.split(',')[0],
        admin1: r.address?.state ?? r.address?.county ?? '',
        country: r.address?.country ?? '',
        lat: parseFloat(r.lat),
        lng: parseFloat(r.lon),
      }));
  } catch (err) {
    console.error('Geocoding error:', err);
    return [];
  }
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  name?: string;
  addresstype?: string;
  address?: {
    city?: string; town?: string; village?: string;
    state?: string; county?: string; country?: string;
  };
}

// ── KNOWN LOCATIONS ────────────────────────────────────────────────────────
export const DEFAULT_LOCATIONS: LocationInfo[] = [
  { city: 'San Francisco', state: 'CA', lat: 37.7749, lng: -122.4194, temp: 58, condition: 'clear' },
  { city: 'New York',      state: 'NY', lat: 40.7128, lng: -74.0060,  temp: 72, condition: 'rain'  },
  { city: 'Chicago',       state: 'IL', lat: 41.8781, lng: -87.6298,  temp: 65, condition: 'drizzle' },
  { city: 'Miami',         state: 'FL', lat: 25.7617, lng: -80.1918,  temp: 84, condition: 'clear' },
  { city: 'Seattle',       state: 'WA', lat: 47.6062, lng: -122.3321, temp: 54, condition: 'rain'  },
  { city: 'Austin',        state: 'TX', lat: 30.2672, lng: -97.7431,  temp: 78, condition: 'clear' },
  { city: 'Denver',        state: 'CO', lat: 39.7392, lng: -104.9903, temp: 61, condition: 'clearing' },
  { city: 'Boston',        state: 'MA', lat: 42.3601, lng: -71.0589,  temp: 67, condition: 'drizzle' },
];
