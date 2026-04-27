import type { Condition, MinuteForecast, LocationInfo, ScenarioKey } from './types';

// ── COLOR / STYLE SYSTEM ───────────────────────────────────────────────────
export const CONDITION_STYLE: Record<Condition, { barColor: string; accent: string; bg: string; textAccent: string; label: string }> = {
  clear:    { barColor: '#3d9e5f', accent: '#2e7d4a', bg: '#f7fbf8', textAccent: '#256038', label: 'Clear'    },
  clearing: { barColor: '#8db840', accent: '#6e9630', bg: '#f8faf4', textAccent: '#4f6e22', label: 'Clearing' },
  drizzle:  { barColor: '#d4a017', accent: '#b88512', bg: '#fdfaf3', textAccent: '#8a620d', label: 'Drizzle'  },
  rain:     { barColor: '#c94f2a', accent: '#a83e1e', bg: '#fdf8f7', textAccent: '#8a2e10', label: 'Rain'     },
};

export function getStyle(condition: Condition, precip: number) {
  if (condition === 'rain' && precip > 0.65) {
    return { ...CONDITION_STYLE.rain, barColor: '#b03020', label: 'Heavy Rain' };
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
};

export function buildForecast(key: ScenarioKey = 'rain_clearing'): MinuteForecast[] {
  return SCENARIOS[key].build();
}

// ── PIRATE WEATHER API ─────────────────────────────────────────────────────
const API_KEY = 'pPrBGDNcJMvdc6hKoEMc6sl13R44I0UE';

function mmToIntensity(mmPerHour: number): number {
  return Math.min(1, mmPerHour / 10);
}

function intensityToCondition(mmPerHour: number): Condition {
  if (mmPerHour < 0.1)  return 'clear';
  if (mmPerHour < 2.5)  return 'drizzle';
  return 'rain';
}

// Map Pirate Weather / Dark Sky icon strings to our Condition type
function iconToCondition(icon: string, precipMm: number): Condition {
  if (icon === 'rain' || icon === 'sleet')          return precipMm < 2.5 ? 'drizzle' : 'rain';
  if (icon === 'cloudy' || icon === 'fog')          return 'clearing';
  if (icon === 'partly-cloudy-day' || icon === 'partly-cloudy-night') return 'clearing';
  return intensityToCondition(precipMm);
}

function celsiusToFahrenheit(c: number): number {
  return c * 9 / 5 + 32;
}

export async function fetchMinuteForecast(lat: number, lng: number): Promise<MinuteForecast[] | null> {
  try {
    const url = `https://api.pirateweather.net/forecast/${API_KEY}/${lat},${lng}?exclude=daily,alerts&units=ca`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();

    const currentTempC: number = data.currently?.temperature ?? 15;
    const currentTempF = celsiusToFahrenheit(currentTempC);
    const currentIcon: string = data.currently?.icon ?? '';
    const currentPrecip: number = data.currently?.precipIntensity ?? 0;

    // Use the API's own icon for the current condition — it's more reliable than
    // intensity thresholds alone, which often read near-zero during light rain.
    const currentCondition = iconToCondition(currentIcon, currentPrecip);

    // minutely data if available
    if (data.minutely?.data && data.minutely.data.length >= 60) {
      return data.minutely.data.slice(0, 60).map((m: { precipIntensity: number; precipProbability?: number }, i: number) => {
        const mmPerHour = m.precipIntensity ?? 0;
        // For minute 0, trust the current icon; beyond that use intensity
        const condition = i === 0 ? currentCondition : intensityToCondition(mmPerHour);
        const temp = currentTempF + i * 0.05;
        return { minute: i, precip: Math.max(mmToIntensity(mmPerHour), i === 0 ? mmToIntensity(currentPrecip) : 0), condition, temp };
      });
    }

    // Fall back to hourly interpolation, anchored to the current icon
    if (data.hourly?.data && data.hourly.data.length >= 2) {
      const h0 = data.hourly.data[0];
      const h1 = data.hourly.data[1];
      return Array.from({ length: 60 }, (_, i) => {
        const t = i / 60;
        const precip = (h0.precipIntensity ?? 0) * (1 - t) + (h1.precipIntensity ?? 0) * t;
        const tempC = (h0.temperature ?? currentTempC) * (1 - t) + (h1.temperature ?? currentTempC) * t;
        const condition = i === 0 ? currentCondition : intensityToCondition(precip);
        return {
          minute: i,
          precip: mmToIntensity(i === 0 ? Math.max(precip, currentPrecip) : precip),
          condition,
          temp: celsiusToFahrenheit(tempC),
        };
      });
    }

    return null;
  } catch (err) {
    console.error('Pirate Weather error:', err);
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
