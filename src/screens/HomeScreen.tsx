import { useState, useRef, useCallback } from 'react';
import { CondIcon } from '../components/Icons';
import { getStyle, timeLabel } from '../weather';
import type { MinuteForecast, HourlyForecast, CurrentConditions, Settings } from '../types';

interface Props {
  onSettings: () => void;
  nowMin: number;
  setNowMin: (n: number) => void;
  forecast: MinuteForecast[];
  hourlyForecast: HourlyForecast[];
  sunriseTime?: Date;
  sunsetTime?: Date;
  location: string;
  currentConditions: CurrentConditions | null;
  settings: Settings;
  lastUpdated: Date | null;
  refreshing: boolean;
  fetchError: boolean;
  onRefresh: () => void;
  darkMode: boolean;
}

function fToC(f: number) { return Math.round((f - 32) * 5 / 9); }
function mphToKph(mph: number) { return Math.round(mph * 1.60934); }
function miToKm(mi: number) { return Math.round(mi * 1.60934); }

function formatAge(d: Date): string {
  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins === 1) return '1 min ago';
  return `${mins} min ago`;
}

function hourLabel(d: Date): string {
  const h = d.getHours() % 12 || 12;
  return `${h}${d.getHours() < 12 ? 'a' : 'p'}`;
}

function shortTime(d: Date): string {
  const h = d.getHours() % 12 || 12;
  const m = d.getMinutes();
  return m === 0
    ? `${h}${d.getHours() < 12 ? 'am' : 'pm'}`
    : `${h}:${d.getMinutes().toString().padStart(2, '0')}${d.getHours() < 12 ? 'am' : 'pm'}`;
}

function bearingToDir(deg: number): string {
  return ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(deg / 45) % 8];
}

function timeOfDayBackground(bg: string, bgDark: string, isDark: boolean): string {
  const h = new Date().getHours();
  if (isDark) {
    if (h >= 5 && h < 7)   return `linear-gradient(180deg, rgba(70,50,10,0.25) 0%, ${bgDark} 50%)`;
    if (h >= 17 && h < 20) return `linear-gradient(180deg, ${bgDark} 40%, rgba(80,40,0,0.2) 100%)`;
    return bgDark;
  }
  if (h >= 21 || h < 5)   return `linear-gradient(180deg, rgba(10,8,30,0.09) 0%, rgba(10,8,30,0.04) 100%), ${bg}`;
  if (h >= 5 && h < 7)    return `linear-gradient(180deg, rgba(255,190,80,0.07) 0%, ${bg} 60%)`;
  if (h >= 17 && h < 20)  return `linear-gradient(180deg, ${bg} 30%, rgba(255,120,40,0.08) 100%)`;
  if (h >= 20 && h < 21)  return `linear-gradient(180deg, ${bg} 0%, rgba(20,12,50,0.07) 100%)`;
  return bg;
}

type HourlyItem =
  | { type: 'hour'; data: HourlyForecast; index: number }
  | { type: 'sun'; event: 'sunrise' | 'sunset'; time: Date };

export function HomeScreen({
  onSettings, nowMin, setNowMin, forecast, hourlyForecast, sunriseTime, sunsetTime,
  location, currentConditions, settings, lastUpdated, refreshing, fetchError, onRefresh, darkMode,
}: Props) {
  const current = forecast[nowMin];
  const cs = getStyle(current.condition, current.precip);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [hoveredMin, setHoveredMin] = useState<number | null>(null);
  const [leaveMin, setLeaveMin] = useState<number | null>(null);
  const [planMode, setPlanMode] = useState(false);

  const useCelsius = settings.tempUnit === '°C';
  const useKph = settings.windUnit === 'km/h';

  const t = {
    text1: darkMode ? '#f5f5f5' : '#0a0a0a',
    text2: darkMode ? '#d0d0d0' : '#3a3a3a',
    text3: darkMode ? '#a0a0a0' : '#5a5a5a',
    text4: darkMode ? '#888' : '#777',
    text5: darkMode ? '#666' : '#999',
    nowLine: darkMode ? 'rgba(255,255,255,0.95)' : '#0a0a0a',
    card: darkMode ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.88)',
    cardStrong: darkMode ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.95)',
    cardNow: darkMode ? 'rgba(255,255,255,0.16)' : '#fff',
    cardHour: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.7)',
    cardBorder: darkMode ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.14)',
    subtleBg: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
    precipTrack: darkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
    divider: darkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
    dividerSoft: darkMode ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.09)',
    dividerStat: darkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
    btnBg: darkMode ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.9)',
    btnBorder: darkMode ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.14)',
    sunLine: darkMode ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.16)',
    transLabelBg: darkMode ? 'rgba(20,20,28,0.95)' : 'rgba(255,255,255,0.92)',
    condText: darkMode ? cs.barColor : cs.textAccent,
  };

  const chunks = (() => {
    const result: { condition: MinuteForecast['condition']; start: number; duration: number; isNow: boolean; precip: number }[] = [];
    let i = nowMin;
    while (i < 60 && result.length < 5) {
      const cond = forecast[i].condition;
      let j = i + 1;
      while (j < 60 && forecast[j].condition === cond) j++;
      result.push({ condition: cond, start: i, duration: j - i, isNow: i === nowMin, precip: forecast[i].precip });
      i = j;
    }
    return result;
  })();

  const isWetCond = (c: MinuteForecast['condition']) => c === 'drizzle' || c === 'rain';
  const isDryCond = (c: MinuteForecast['condition']) => c === 'clear' || c === 'clearing';

  const bestWindow = (() => {
    let i = nowMin;
    if (isDryCond(forecast[nowMin].condition)) {
      while (i < 60 && isDryCond(forecast[i].condition)) i++;
    }
    while (i < 60) {
      if (isDryCond(forecast[i].condition)) {
        const start = i;
        while (i < 60 && isDryCond(forecast[i].condition)) i++;
        if (i - start >= 5) return { start, end: i - 1 };
      } else i++;
    }
    return null;
  })();

  const transitions = (() => {
    const res: { minute: number; toCondition: MinuteForecast['condition'] }[] = [];
    for (let i = nowMin + 1; i < 60; i++) {
      if (forecast[i].condition !== forecast[i - 1].condition)
        res.push({ minute: i, toCondition: forecast[i].condition });
    }
    return res;
  })();

  const nextEvent = (() => {
    for (let i = nowMin + 1; i < 60; i++) {
      const cond = forecast[i].condition;
      if (isDryCond(current.condition) && isWetCond(cond)) {
        const mins = i - nowMin;
        const label = cond === 'rain' ? 'Rain' : 'Drizzle';
        if (mins <= 5)  return `${label} arriving — head in soon`;
        if (mins <= 12) return `${label} in ${mins} min — wrap up outside`;
        return `${label} expected in ${mins} min`;
      }
      if (isWetCond(current.condition) && isDryCond(cond)) {
        const mins = i - nowMin;
        let dryEnd = i;
        while (dryEnd < 60 && isDryCond(forecast[dryEnd].condition)) dryEnd++;
        const winLen = dryEnd - i;
        const winStr = winLen < 60 - nowMin ? ` · ${winLen} min window` : '';
        if (mins <= 5)  return `Clearing up any moment now${winStr}`;
        if (mins <= 15) return `Clears in ${mins} min${winStr}`;
        return `Should clear in about ${mins} min${winStr}`;
      }
      if (current.condition === 'drizzle' && cond === 'rain') return `Rain intensifying in ${i - nowMin} min`;
      if (current.condition === 'rain' && cond === 'drizzle') return `Rain easing up in ${i - nowMin} min`;
    }
    if (isDryCond(current.condition)) return 'Clear skies for the next hour';
    if (current.condition === 'drizzle') return 'Light drizzle through the hour';
    return 'Rain continues through the hour';
  })();

  const handleTimelineInteract = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const min = Math.round(Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)) * 59);
    if (planMode) setLeaveMin(min);
    else setNowMin(min);
  }, [setNowMin, planMode]);

  const feelsLikeF  = currentConditions?.feelsLike   ?? Math.round(current.temp - current.precip * 5);
  const windMph     = currentConditions?.windSpeed    ?? (current.condition === 'rain' ? 14 : current.condition === 'drizzle' ? 8 : 4);
  const windBearing = currentConditions?.windBearing;
  const humidity    = currentConditions?.humidity     ?? (current.condition === 'rain' ? 91 : current.condition === 'drizzle' ? 79 : 54);
  const uvIndex     = currentConditions?.uvIndex      ?? (current.condition === 'clear' ? 4 : 1);
  const visMi       = currentConditions?.visibility   ?? (current.condition === 'rain' ? 1 : 10);

  const displayTemp     = useCelsius ? fToC(current.temp) : Math.round(current.temp);
  const displayFeels    = useCelsius ? fToC(feelsLikeF) : feelsLikeF;
  const displayWind     = useKph ? mphToKph(windMph) : windMph;
  const displayWindUnit = useKph ? 'km/h' : 'mph';
  const displayVis      = useKph ? `${miToKm(visMi)}km` : `${visMi}mi`;
  const tempUnit        = settings.tempUnit;

  const apiHigh = currentConditions?.highTemp != null ? (useCelsius ? fToC(currentConditions.highTemp) : currentConditions.highTemp) : null;
  const apiLow  = currentConditions?.lowTemp  != null ? (useCelsius ? fToC(currentConditions.lowTemp)  : currentConditions.lowTemp)  : null;
  const hourlyTemps = hourlyForecast.slice(0, 24).map(h => useCelsius ? fToC(h.temp) : Math.round(h.temp));
  const highTemp = apiHigh ?? (hourlyTemps.length > 0 ? Math.max(...hourlyTemps) : null);
  const lowTemp  = apiLow  ?? (hourlyTemps.length > 0 ? Math.min(...hourlyTemps) : null);

  const hourlyItems: HourlyItem[] = [];
  for (let i = 0; i < hourlyForecast.length; i++) {
    const h = hourlyForecast[i];
    const prev = hourlyForecast[i - 1];
    if (prev && sunriseTime && sunriseTime > prev.time && sunriseTime <= h.time)
      hourlyItems.push({ type: 'sun', event: 'sunrise', time: sunriseTime });
    if (prev && sunsetTime && sunsetTime > prev.time && sunsetTime <= h.time)
      hourlyItems.push({ type: 'sun', event: 'sunset', time: sunsetTime });
    hourlyItems.push({ type: 'hour', data: h, index: i });
  }

  const condLabelMap: Record<string, string> = { rain: 'Rain', drizzle: 'Drizzle', clearing: 'Clearing', clear: 'Clear' };
  const baseDescMap: Record<string, string> = {
    rain: 'Keep an umbrella handy', drizzle: 'Light mist in the air',
    clearing: 'Skies brightening', clear: 'Great time to head out',
  };

  const minsUntilWet = (() => {
    for (let i = nowMin + 1; i < 60; i++) {
      if (forecast[i].condition === 'drizzle' || forecast[i].condition === 'rain') return i - nowMin;
    }
    return null;
  })();

  function chunkDesc(condition: string, isNow: boolean): string {
    if (isNow && (condition === 'clear' || condition === 'clearing') && minsUntilWet !== null)
      return minsUntilWet <= 15 ? 'Enjoy it while it lasts' : 'Make the most of it';
    if (isNow && condition === 'clearing' && minsUntilWet === null) return 'Skies brightening';
    return baseDescMap[condition] ?? '';
  }

  const uvLabel = uvIndex <= 2 ? 'Low' : uvIndex <= 5 ? 'Moderate' : uvIndex <= 7 ? 'High' : 'Very High';
  const isStale = lastUpdated != null && (Date.now() - lastUpdated.getTime()) > 25 * 60 * 1000;
  const windLabel = windBearing != null ? `${bearingToDir(windBearing)} ${displayWind}` : `${displayWind}`;
  const isRaining = current.condition === 'rain' || current.condition === 'drizzle';
  const dropCount = current.condition === 'rain' ? 22 : 13;

  return (
    <div style={{
      width: '100%', height: '100%',
      background: timeOfDayBackground(cs.bg, cs.bgDark, darkMode),
      display: 'flex', flexDirection: 'column',
      transition: 'background 0.9s ease',
      overflow: 'hidden', position: 'relative',
    }}>

      {/* RAIN ANIMATION OVERLAY */}
      {isRaining && (
        <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
          {Array.from({ length: dropCount }).map((_, i) => (
            <div key={i} style={{
              position: 'absolute',
              left: `${(i * 23 + 5) % 101}%`,
              top: `-${10 + (i * 7) % 40}%`,
              width: current.condition === 'rain' ? '1px' : '0.75px',
              height: `${(current.condition === 'rain' ? 18 : 11) + (i % 4) * 4}px`,
              background: `rgba(100,130,185,${darkMode ? 0.38 + (i % 5) * 0.07 : 0.22 + (i % 5) * 0.05})`,
              borderRadius: '1px',
              animation: `rainDrop ${0.62 + (i % 9) * 0.08}s linear ${-(i * 0.31) % 2.1}s infinite`,
            }} />
          ))}
        </div>
      )}

      {/* HEADER */}
      <div style={{ padding: 'var(--top-safe) 22px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: cs.accent, opacity: 0.35 }} />
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: cs.accent, opacity: 0.65 }} />
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: cs.accent }} />
            </div>
            <span style={{ fontSize: 17, fontWeight: 700, color: cs.accent, letterSpacing: '-0.02em', lineHeight: 1 }}>soon</span>
          </div>
          <div style={{ fontSize: 17, fontWeight: 600, color: t.text2, letterSpacing: '-0.01em' }}>
            {location ? location.split(',')[0] : 'My Location'}
          </div>
        </div>
        <button onClick={onSettings} style={{
          background: t.btnBg, border: `1.5px solid ${t.btnBorder}`,
          borderRadius: 22, padding: '10px 12px', cursor: 'pointer', fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', minWidth: 44, minHeight: 44, justifyContent: 'center',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={t.text2} strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>
      </div>

      {/* HERO */}
      <div style={{ padding: '20px 22px 0', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
        <div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: darkMode ? cs.accent + '28' : cs.accent + '22', borderRadius: 7,
            padding: '5px 11px 5px 9px', marginBottom: 14, transition: 'background 0.8s',
          }}>
            <CondIcon condition={current.condition} size={14} color={cs.accent} />
            <span style={{ fontSize: 12, fontWeight: 700, color: t.condText, letterSpacing: '0.07em', textTransform: 'uppercase' }}>{cs.label}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', lineHeight: 1 }}>
            <div style={{ fontSize: 92, fontWeight: 300, color: t.text1, letterSpacing: '-0.04em' }}>{displayTemp}</div>
            <div style={{ fontSize: 40, fontWeight: 300, color: t.text1, marginTop: 12, marginLeft: 2 }}>{tempUnit}</div>
          </div>
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ color: t.text2, fontSize: 14, fontWeight: 500 }}>Feels like {displayFeels}° · {humidity}% humidity</div>
            {highTemp !== null && lowTemp !== null && (
              <div style={{ color: t.text3, fontSize: 13, fontWeight: 500 }}>H: {highTemp}° &nbsp; L: {lowTemp}°</div>
            )}
          </div>
        </div>
        <div style={{ paddingBottom: 28, opacity: 0.75, flexShrink: 0 }}>
          <CondIcon condition={current.condition} size={54} color={cs.accent} />
        </div>
      </div>

      {/* NEXT EVENT CALLOUT */}
      <div style={{ margin: '20px 22px 0', position: 'relative', zIndex: 1 }}>
        <div style={{
          background: t.cardStrong, borderRadius: 14, padding: '14px 16px',
          border: `1.5px solid ${cs.accent}45`,
          display: 'flex', alignItems: 'center', gap: 10,
          transition: 'border-color 0.8s',
        }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: cs.barColor, flexShrink: 0 }} />
          <span style={{ fontSize: 15, fontWeight: 600, color: t.text1, flex: 1 }}>{nextEvent}</span>
          <button onClick={onRefresh} disabled={refreshing} style={{
            background: 'none', border: 'none', cursor: refreshing ? 'default' : 'pointer',
            padding: 8, color: t.text3, display: 'flex', alignItems: 'center',
            opacity: refreshing ? 0.4 : 1, transition: 'opacity 0.2s', flexShrink: 0,
            minWidth: 32, minHeight: 32, justifyContent: 'center',
          }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
              style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }}>
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
          </button>
        </div>
        {fetchError ? (
          <div style={{ fontSize: 12, color: '#c0392b', fontWeight: 500, marginTop: 6, textAlign: 'right', paddingRight: 2 }}>
            Couldn't update · tap to retry
          </div>
        ) : lastUpdated && (
          <div style={{ fontSize: 11, color: isStale ? '#d4a017' : t.text4, fontWeight: 500, marginTop: 6, textAlign: 'right', paddingRight: 2, transition: 'color 0.3s' }}>
            {isStale ? '⚠ ' : ''}Updated {formatAge(lastUpdated)}
          </div>
        )}
      </div>

      {/* 60-MIN TIMELINE */}
      <div style={{ margin: '18px 0 0', padding: '0 22px', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, color: t.text3, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>Next hour</span>
            <button onClick={() => {
              if (planMode) { setPlanMode(false); }
              else { setPlanMode(true); setLeaveMin(leaveMin ?? Math.min(nowMin + 15, 59)); }
            }} style={{
              background: planMode ? cs.accent + '28' : t.subtleBg,
              border: `1.5px solid ${planMode ? cs.accent + '70' : t.cardBorder}`,
              borderRadius: 12, padding: '5px 12px', cursor: 'pointer', fontFamily: 'inherit',
              fontSize: 12, fontWeight: 700, color: planMode ? cs.accent : t.text2,
              letterSpacing: '0.06em', textTransform: 'uppercase', transition: 'all 0.18s',
            }}>
              {planMode ? 'Done' : 'Plan'}
            </button>
          </div>
          <span style={{ fontSize: 12, fontWeight: 500, color: hoveredMin !== null ? t.condText : t.text3, fontFamily: 'monospace', transition: 'color 0.2s' }}>
            {hoveredMin !== null
              ? `${timeLabel(hoveredMin - nowMin)} · +${hoveredMin - nowMin}min`
              : `${timeLabel(0)} → ${timeLabel(60 - nowMin, true)}`}
          </span>
        </div>

        {/* Tooltip anchor — overflow:visible so tooltip peeks above the chart */}
        <div style={{ position: 'relative' }}>

          {/* SCRUB TOOLTIP */}
          {hoveredMin !== null && (() => {
            const hm = forecast[hoveredMin];
            const hs = getStyle(hm.condition, hm.precip);
            const hTemp = useCelsius ? fToC(hm.temp) : Math.round(hm.temp);
            const clamp = Math.max(6, Math.min(94, (hoveredMin / 59) * 100));
            return (
              <div style={{
                position: 'absolute', bottom: 'calc(100% + 8px)', left: `${clamp}%`,
                transform: 'translateX(-50%)', pointerEvents: 'none', zIndex: 20,
              }}>
                <div style={{
                  background: 'rgba(18,18,24,0.96)', borderRadius: 10,
                  padding: '10px 14px', border: `1.5px solid ${hs.barColor}70`,
                  minWidth: 92, textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 3 }}>
                    <CondIcon condition={hm.condition} size={12} color={hs.barColor} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: hs.barColor, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{hs.label}</span>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: '#fff', lineHeight: 1.1 }}>{hTemp}{tempUnit}</div>
                  <div style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>
                    {hoveredMin === nowMin ? 'now' : `+${hoveredMin - nowMin} min`}
                  </div>
                </div>
                <div style={{
                  position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
                  borderLeft: '5px solid transparent', borderRight: '5px solid transparent',
                  borderTop: '5px solid rgba(22,22,28,0.94)',
                }} />
              </div>
            );
          })()}

          <div
            ref={timelineRef}
            onClick={handleTimelineInteract}
            onTouchMove={handleTimelineInteract}
            onMouseMove={(e) => {
              const rect = timelineRef.current!.getBoundingClientRect();
              setHoveredMin(Math.round(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) * 59));
            }}
            onMouseLeave={() => setHoveredMin(null)}
            style={{ width: '100%', height: 64, cursor: planMode ? 'pointer' : 'crosshair', background: t.subtleBg, borderRadius: 12, overflow: 'hidden', position: 'relative', touchAction: 'none' }}
          >
            <div style={{ display: 'flex', height: '100%', alignItems: 'flex-end', gap: 1.5, padding: '0 2px' }}>
              {forecast.map((m, i) => {
                const s = getStyle(m.condition, m.precip);
                const barH = m.precip > 0 ? 16 + m.precip * 54 : 6;
                return (
                  <div key={i} style={{
                    flex: 1, minWidth: 2, height: `${Math.round(barH)}px`,
                    background: s.barColor, borderRadius: '3px 3px 0 0',
                    opacity: i < nowMin ? 0.2 : hoveredMin === i ? 1 : 0.88,
                    transition: 'opacity 0.12s',
                  }} />
                );
              })}
            </div>

            {/* Best dry window highlight */}
            {bestWindow && (
              <div style={{
                position: 'absolute', top: 0, bottom: 0,
                left: `${(bestWindow.start / 59) * 100}%`,
                width: `${((bestWindow.end - bestWindow.start + 1) / 59) * 100}%`,
                background: 'rgba(61,158,95,0.13)',
                borderLeft: '1.5px solid rgba(61,158,95,0.55)',
                borderRight: '1.5px solid rgba(61,158,95,0.55)',
                pointerEvents: 'none',
              }} />
            )}

            {/* Condition transition markers */}
            {transitions.map(tr => {
              const ts = getStyle(tr.toCondition, 0.5);
              return (
                <div key={tr.minute} style={{
                  position: 'absolute', top: 0, bottom: 0,
                  left: `${(tr.minute / 59) * 100}%`,
                  width: 1.5, background: `${ts.barColor}b0`, pointerEvents: 'none',
                }}>
                  <div style={{
                    position: 'absolute', top: 5, left: '50%', transform: 'translateX(-50%)',
                    fontSize: 9, fontWeight: 700, color: darkMode ? ts.barColor : ts.textAccent,
                    background: t.transLabelBg, borderRadius: 4,
                    padding: '2px 5px', letterSpacing: '0.05em', whiteSpace: 'nowrap',
                    textTransform: 'uppercase',
                    boxShadow: darkMode ? '0 0 0 1px rgba(255,255,255,0.08)' : '0 0 0 1px rgba(0,0,0,0.05)',
                  }}>{ts.label.slice(0, 5)}</div>
                </div>
              );
            })}

            {/* Now indicator */}
            <div style={{
              position: 'absolute', top: 0, bottom: 0,
              left: `calc(${(nowMin / 59) * 100}% - 1.5px)`,
              width: 3, background: t.nowLine, borderRadius: 1.5,
              transition: 'left 0.35s ease',
            }}>
              <div style={{
                position: 'absolute', top: -2, left: '50%', transform: 'translateX(-50%)',
                width: 9, height: 9, borderRadius: '50%', background: t.nowLine,
                animation: 'nowBlink 2s ease-in-out infinite',
              }} />
            </div>

            {/* Leave marker */}
            {leaveMin !== null && (
              <div style={{
                position: 'absolute', top: 0, bottom: 0,
                left: `calc(${(leaveMin / 59) * 100}% - 1.5px)`,
                width: 3,
                background: 'repeating-linear-gradient(to bottom, #d4a017 0px, #d4a017 5px, transparent 5px, transparent 10px)',
                pointerEvents: 'none', transition: 'left 0.15s ease',
              }}>
                <div style={{
                  position: 'absolute', top: -6, left: '50%', transform: 'translateX(-50%) rotate(45deg)',
                  width: 10, height: 10, background: '#d4a017', borderRadius: 2,
                }} />
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 7, padding: '0 1px' }}>
          {[0, 15, 30, 45, 60].map(tick => (
            <span key={tick} style={{ fontSize: 11, fontWeight: 500, color: t.text3, fontFamily: 'monospace' }}>
              {tick === 0 ? 'now' : `+${tick}m`}
            </span>
          ))}
        </div>
      </div>

      {/* LEAVE CALLOUT */}
      {leaveMin !== null && (() => {
        const lm = forecast[leaveMin];
        const ls = getStyle(lm.condition, lm.precip);
        const lTemp = useCelsius ? fToC(lm.temp) : Math.round(lm.temp);
        const minsUntil = leaveMin - nowMin;
        const leaveTime = new Date(Date.now() + minsUntil * 60000);
        return (
          <div style={{ margin: '10px 22px 0', position: 'relative', zIndex: 1 }}>
            <div style={{
              background: t.cardStrong, borderRadius: 14, padding: '13px 16px',
              border: '1.5px solid rgba(212,160,23,0.55)',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{ width: 10, height: 10, background: '#d4a017', borderRadius: 2, transform: 'rotate(45deg)', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: t.text1 }}>
                  {minsUntil === 0 ? 'Leaving now' : `Leave in ${minsUntil} min`}
                  <span style={{ fontWeight: 500, color: t.text3, marginLeft: 6 }}>{shortTime(leaveTime)}</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 500, color: t.text2, marginTop: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CondIcon condition={lm.condition} size={13} color={ls.accent} />
                  {ls.label} · {lTemp}{tempUnit}
                </div>
              </div>
              <button onClick={() => { setLeaveMin(null); setPlanMode(false); }} style={{
                background: t.subtleBg, border: 'none', cursor: 'pointer', borderRadius: '50%',
                color: t.text2, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>
        );
      })()}

      {/* SCROLLABLE LOWER SECTION */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 'var(--bottom-safe)', marginTop: 18, position: 'relative', zIndex: 1 }}>

        {/* HOURLY FORECAST */}
        {hourlyForecast.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 12, color: t.text3, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, margin: '0 22px 12px' }}>
              24-hour forecast
            </div>
            <div className="hourly-scroll" style={{ overflowX: 'auto', paddingLeft: 22, paddingRight: 22 }}>
              <div style={{ display: 'flex', gap: 8, paddingBottom: 4, alignItems: 'flex-end' }}>
                {hourlyItems.map((item, idx) => {
                  if (item.type === 'sun') {
                    const isSunrise = item.event === 'sunrise';
                    return (
                      <div key={`sun-${idx}`} style={{
                        flexShrink: 0, width: 52, display: 'flex', flexDirection: 'column',
                        alignItems: 'center', gap: 5, paddingBottom: 12, opacity: 0.85,
                      }}>
                        <div style={{ width: 1.5, height: 32, background: t.sunLine, borderRadius: 1 }} />
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d4a017" strokeWidth="2" strokeLinecap="round">
                          {isSunrise ? (
                            <>
                              <path d="M12 2v2M4.93 4.93l1.41 1.41M2 12h2M19.07 4.93l-1.41 1.41M22 12h-2"/>
                              <path d="M5 17H3M21 17h-2M12 10a5 5 0 0 1 5 5H7a5 5 0 0 1 5-5z"/>
                              <polyline points="12 7 12 10"/>
                            </>
                          ) : (
                            <>
                              <path d="M12 22v-2M4.93 19.07l1.41-1.41M2 12h2M19.07 19.07l-1.41-1.41M22 12h-2"/>
                              <path d="M5 7H3M21 7h-2M12 14a5 5 0 0 0 5-5H7a5 5 0 0 0 5 5z"/>
                            </>
                          )}
                        </svg>
                        <div style={{ fontSize: 11, color: darkMode ? '#d4a017' : '#9d6f00', fontWeight: 700, textAlign: 'center', lineHeight: 1.3 }}>
                          {isSunrise ? 'Rise' : 'Set'}<br/>
                          <span style={{ fontWeight: 500, color: t.text3 }}>{shortTime(item.time)}</span>
                        </div>
                      </div>
                    );
                  }
                  const h = item.data;
                  const hs = getStyle(h.condition, h.precip);
                  const displayHTemp = useCelsius ? fToC(h.temp) : Math.round(h.temp);
                  const isNowHour = item.index === 0;
                  const barPct = h.precipProb / 100;
                  return (
                    <div key={`h-${item.index}`} style={{
                      flexShrink: 0, width: 66,
                      background: isNowHour ? t.cardNow : t.cardHour,
                      borderRadius: 14,
                      border: isNowHour ? `2px solid ${cs.accent}55` : `1.5px solid ${t.cardBorder}`,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden',
                    }}>
                      <div style={{ padding: '12px 0 9px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: '100%' }}>
                        <div style={{ fontSize: 12, color: isNowHour ? t.condText : t.text2, fontWeight: isNowHour ? 700 : 600 }}>
                          {isNowHour ? 'now' : hourLabel(h.time)}
                        </div>
                        <CondIcon condition={h.condition} size={18} color={hs.accent} />
                        <div style={{ fontSize: 15, fontWeight: 600, color: t.text1 }}>{displayHTemp}°</div>
                      </div>
                      <div style={{ width: '100%', height: 5, background: t.precipTrack }}>
                        {barPct > 0.05 && (
                          <div style={{ height: '100%', width: `${Math.round(barPct * 100)}%`, background: hs.barColor, opacity: 0.85, borderRadius: '0 2px 2px 0' }} />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* DETAIL CARD */}
        <div style={{ margin: '0 22px' }}>
          <div style={{ background: t.card, borderRadius: 18, overflow: 'hidden', border: `1.5px solid ${t.cardBorder}` }}>
            <div style={{ padding: '4px 18px 0' }}>
              <div style={{ fontSize: 12, color: t.text3, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, padding: '14px 0 10px' }}>
                What to expect
              </div>
              {chunks.map((chunk, idx) => {
                const s = getStyle(chunk.condition, chunk.precip);
                const timeStr = chunk.isNow ? 'Now' : `+${chunk.start - nowMin} min`;
                return (
                  <div key={idx} style={{
                    display: 'flex', alignItems: 'center', gap: 13, padding: '12px 0',
                    borderBottom: idx < chunks.length - 1 ? `1px solid ${t.dividerSoft}` : 'none',
                    opacity: chunk.isNow ? 1 : 0.7,
                  }}>
                    <div style={{ width: 4, alignSelf: 'stretch', background: s.barColor, borderRadius: 2, flexShrink: 0 }} />
                    <CondIcon condition={chunk.condition} size={20} color={s.accent} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: t.text1 }}>{condLabelMap[chunk.condition]}</div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: t.text3, marginTop: 2 }}>{chunkDesc(chunk.condition, chunk.isNow)}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: darkMode ? s.barColor : s.textAccent }}>{timeStr}</div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: t.text4, marginTop: 2 }}>{chunk.duration}min</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ height: 1, background: t.divider, margin: '4px 0' }} />
            <div style={{ display: 'flex', padding: '16px 0 18px' }}>
              {[
                { label: 'Wind',  value: `${windLabel} ${displayWindUnit}` },
                { label: 'Humid', value: `${humidity}%` },
                { label: 'UV',    value: `${uvIndex} · ${uvLabel}` },
                { label: 'Vis',   value: displayVis },
              ].map((s, i, arr) => (
                <div key={s.label} style={{
                  flex: 1, textAlign: 'center',
                  borderRight: i < arr.length - 1 ? `1px solid ${t.dividerStat}` : 'none',
                }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: t.text1 }}>{s.value}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: t.text3, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
