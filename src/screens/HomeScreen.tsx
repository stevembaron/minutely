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
  return m === 0 ? `${h}${d.getHours() < 12 ? 'am' : 'pm'}` : `${h}:${d.getMinutes().toString().padStart(2,'0')}${d.getHours() < 12 ? 'am' : 'pm'}`;
}

function bearingToDir(deg: number): string {
  return ['N','NE','E','SE','S','SW','W','NW'][Math.round(deg / 45) % 8];
}

function timeOfDayBackground(bg: string): string {
  const h = new Date().getHours();
  if (h >= 21 || h < 5)
    return `linear-gradient(180deg, rgba(10,8,30,0.09) 0%, rgba(10,8,30,0.04) 100%), ${bg}`;
  if (h >= 5 && h < 7)
    return `linear-gradient(180deg, rgba(255,190,80,0.07) 0%, ${bg} 60%)`;
  if (h >= 17 && h < 20)
    return `linear-gradient(180deg, ${bg} 30%, rgba(255,120,40,0.08) 100%)`;
  if (h >= 20 && h < 21)
    return `linear-gradient(180deg, ${bg} 0%, rgba(20,12,50,0.07) 100%)`;
  return bg;
}

type HourlyItem =
  | { type: 'hour'; data: HourlyForecast; index: number }
  | { type: 'sun'; event: 'sunrise' | 'sunset'; time: Date };

export function HomeScreen({ onSettings, nowMin, setNowMin, forecast, hourlyForecast, sunriseTime, sunsetTime, location, currentConditions, settings, lastUpdated, refreshing, fetchError, onRefresh }: Props) {
  const current = forecast[nowMin];
  const cs = getStyle(current.condition, current.precip);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [hoveredMin, setHoveredMin] = useState<number | null>(null);

  const useCelsius = settings.tempUnit === '°C';
  const useKph = settings.windUnit === 'km/h';

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

  const nextEvent = (() => {
    const isWet = (c: MinuteForecast['condition']) => c === 'drizzle' || c === 'rain';
    const isDry = (c: MinuteForecast['condition']) => c === 'clear' || c === 'clearing';
    for (let i = nowMin + 1; i < 60; i++) {
      const cond = forecast[i].condition;
      if (isDry(current.condition) && isWet(cond))
        return `${cond === 'rain' ? 'Rain' : 'Drizzle'} starting in ${i - nowMin} min`;
      if (isWet(current.condition) && isDry(cond))
        return `Clears up in ${i - nowMin} min`;
      if (current.condition === 'drizzle' && cond === 'rain')
        return `Heavier rain in ${i - nowMin} min`;
      if (current.condition === 'rain' && cond === 'drizzle')
        return `Easing to drizzle in ${i - nowMin} min`;
    }
    if (isDry(current.condition)) return 'Clear skies for the rest of the hour';
    if (current.condition === 'drizzle') return 'Light drizzle through the hour';
    return 'Rain continues through the hour';
  })();

  const handleTimelineInteract = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setNowMin(Math.round(Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)) * 59));
  }, [setNowMin]);

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

  // H/L: prefer from daily API, fall back to hourly range
  const apiHigh = currentConditions?.highTemp != null ? (useCelsius ? fToC(currentConditions.highTemp) : currentConditions.highTemp) : null;
  const apiLow  = currentConditions?.lowTemp  != null ? (useCelsius ? fToC(currentConditions.lowTemp)  : currentConditions.lowTemp)  : null;
  const hourlyTemps = hourlyForecast.slice(0, 24).map(h => useCelsius ? fToC(h.temp) : Math.round(h.temp));
  const highTemp = apiHigh ?? (hourlyTemps.length > 0 ? Math.max(...hourlyTemps) : null);
  const lowTemp  = apiLow  ?? (hourlyTemps.length > 0 ? Math.min(...hourlyTemps) : null);

  // Build hourly items, inserting sunrise/sunset markers between the right hours
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
  const baseDescMap: Record<string, string> = { rain: 'Keep an umbrella handy', drizzle: 'Light mist in the air', clearing: 'Skies brightening', clear: 'Great time to head out' };

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

  return (
    <div style={{
      width: '100%', height: '100%',
      background: timeOfDayBackground(cs.bg),
      display: 'flex', flexDirection: 'column',
      transition: 'background 0.9s ease',
      overflow: 'hidden',
    }}>

      {/* HEADER */}
      <div style={{ padding: 'var(--top-safe) 22px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: cs.accent, opacity: 0.35 }} />
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: cs.accent, opacity: 0.65 }} />
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: cs.accent }} />
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, color: cs.accent, letterSpacing: '-0.02em', lineHeight: 1 }}>soon</span>
          </div>
          <div style={{ fontSize: 15, fontWeight: 500, color: '#666', letterSpacing: '-0.01em' }}>
            {location ? location.split(',')[0] : 'My Location'}
          </div>
        </div>
        <button onClick={onSettings} style={{
          background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(0,0,0,0.09)',
          borderRadius: 20, padding: '7px 10px', cursor: 'pointer', fontFamily: 'inherit',
          display: 'flex', alignItems: 'center',
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>
      </div>

      {/* HERO */}
      <div style={{ padding: '20px 22px 0', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: cs.accent + '18', borderRadius: 6,
            padding: '4px 10px 4px 7px', marginBottom: 14, transition: 'background 0.8s',
          }}>
            <CondIcon condition={current.condition} size={13} color={cs.accent} />
            <span style={{ fontSize: 11, fontWeight: 700, color: cs.textAccent, letterSpacing: '0.07em', textTransform: 'uppercase' }}>{cs.label}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', lineHeight: 1 }}>
            <div style={{ fontSize: 88, fontWeight: 300, color: '#1a1a1a', letterSpacing: '-0.04em' }}>{displayTemp}</div>
            <div style={{ fontSize: 38, fontWeight: 300, color: '#1a1a1a', marginTop: 12, marginLeft: 2 }}>{tempUnit}</div>
          </div>
          <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ color: '#888', fontSize: 13 }}>Feels like {displayFeels}° · {humidity}% humidity</div>
            {highTemp !== null && lowTemp !== null && (
              <div style={{ color: '#aaa', fontSize: 12 }}>H: {highTemp}° &nbsp; L: {lowTemp}°</div>
            )}
          </div>
        </div>
        <div style={{ paddingBottom: 28, opacity: 0.75, flexShrink: 0 }}>
          <CondIcon condition={current.condition} size={54} color={cs.accent} />
        </div>
      </div>

      {/* NEXT EVENT CALLOUT */}
      <div style={{ margin: '20px 22px 0' }}>
        <div style={{
          background: 'rgba(255,255,255,0.85)', borderRadius: 14, padding: '12px 16px',
          border: `1.5px solid ${cs.accent}28`,
          display: 'flex', alignItems: 'center', gap: 10,
          transition: 'border-color 0.8s',
        }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: cs.barColor, flexShrink: 0 }} />
          <span style={{ fontSize: 14, fontWeight: 500, color: '#1e1e1e', flex: 1 }}>{nextEvent}</span>
          <button onClick={onRefresh} disabled={refreshing} style={{
            background: 'none', border: 'none', cursor: refreshing ? 'default' : 'pointer',
            padding: 4, color: '#ccc', display: 'flex', alignItems: 'center',
            opacity: refreshing ? 0.4 : 1, transition: 'opacity 0.2s', flexShrink: 0,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
              style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }}>
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
          </button>
        </div>
        {fetchError ? (
          <div style={{ fontSize: 11, color: '#c0392b', marginTop: 5, textAlign: 'right', paddingRight: 2 }}>
            Couldn't update · tap to retry
          </div>
        ) : lastUpdated && (
          <div style={{ fontSize: 10, color: isStale ? '#d4a017' : '#ccc', marginTop: 5, textAlign: 'right', paddingRight: 2, transition: 'color 0.3s' }}>
            {isStale ? '⚠ ' : ''}Updated {formatAge(lastUpdated)}
          </div>
        )}
      </div>

      {/* 60-MIN TIMELINE */}
      <div style={{ margin: '18px 0 0', padding: '0 22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 11, color: '#aaa', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500 }}>Next hour</span>
          <span style={{ fontSize: 11, color: hoveredMin !== null ? cs.textAccent : '#bbb', fontFamily: 'monospace', transition: 'color 0.2s' }}>
            {hoveredMin !== null ? `${timeLabel(hoveredMin - nowMin)} · +${hoveredMin - nowMin}min` : `${timeLabel(0)} → ${timeLabel(60 - nowMin, true)}`}
          </span>
        </div>
        <div
          ref={timelineRef}
          onClick={handleTimelineInteract}
          onTouchMove={handleTimelineInteract}
          onMouseMove={(e) => {
            const rect = timelineRef.current!.getBoundingClientRect();
            setHoveredMin(Math.round(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) * 59));
          }}
          onMouseLeave={() => setHoveredMin(null)}
          style={{ width: '100%', height: 56, cursor: 'crosshair', background: 'rgba(0,0,0,0.04)', borderRadius: 10, overflow: 'hidden', position: 'relative' }}
        >
          <div style={{ display: 'flex', height: '100%', alignItems: 'flex-end', gap: 1.5, padding: '0 2px' }}>
            {forecast.map((m, i) => {
              const s = getStyle(m.condition, m.precip);
              const barH = m.precip > 0 ? 14 + m.precip * 48 : 5;
              return (
                <div key={i} style={{
                  flex: 1, minWidth: 2, height: `${Math.round(barH)}px`,
                  background: s.barColor, borderRadius: '3px 3px 0 0',
                  opacity: i < nowMin ? 0.15 : hoveredMin === i ? 1 : 0.75,
                  transition: 'opacity 0.12s',
                }} />
              );
            })}
          </div>
          <div style={{
            position: 'absolute', top: 0, bottom: 0,
            left: `calc(${(nowMin / 59) * 100}% - 1px)`,
            width: 2, background: '#1a1a1a', borderRadius: 1,
            transition: 'left 0.35s ease',
          }}>
            <div style={{
              position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)',
              width: 7, height: 7, borderRadius: '50%', background: '#1a1a1a',
              animation: 'nowBlink 2s ease-in-out infinite',
            }} />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, padding: '0 1px' }}>
          {[0, 15, 30, 45, 60].map(t => (
            <span key={t} style={{ fontSize: 10, color: '#bbb', fontFamily: 'monospace' }}>
              {t === 0 ? 'now' : `+${t}m`}
            </span>
          ))}
        </div>
      </div>

      {/* SCROLLABLE LOWER SECTION */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 'var(--bottom-safe)', marginTop: 18 }}>

        {/* HOURLY FORECAST with sunrise/sunset markers */}
        {hourlyForecast.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: '#aaa', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, margin: '0 22px 10px' }}>
              24-hour forecast
            </div>
            <div className="hourly-scroll" style={{ overflowX: 'auto', paddingLeft: 22, paddingRight: 22 }}>
              <div style={{ display: 'flex', gap: 8, paddingBottom: 4, alignItems: 'flex-end' }}>
                {hourlyItems.map((item, idx) => {
                  if (item.type === 'sun') {
                    const isSunrise = item.event === 'sunrise';
                    return (
                      <div key={`sun-${idx}`} style={{
                        flexShrink: 0, width: 46,
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        gap: 4, paddingBottom: 10, opacity: 0.7,
                      }}>
                        <div style={{ width: 1, height: 28, background: 'rgba(0,0,0,0.1)', borderRadius: 1 }} />
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d4a017" strokeWidth="2" strokeLinecap="round">
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
                        <div style={{ fontSize: 9, color: '#b88512', fontWeight: 600, textAlign: 'center', lineHeight: 1.2 }}>
                          {isSunrise ? 'Rise' : 'Set'}<br/>
                          <span style={{ fontWeight: 400, color: '#aaa' }}>{shortTime(item.time)}</span>
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
                      flexShrink: 0, width: 58,
                      background: isNowHour ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.5)',
                      borderRadius: 14,
                      border: isNowHour ? `1.5px solid ${cs.accent}35` : '1.5px solid transparent',
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      overflow: 'hidden',
                    }}>
                      <div style={{ padding: '11px 0 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, width: '100%' }}>
                        <div style={{ fontSize: 11, color: isNowHour ? cs.textAccent : '#999', fontWeight: isNowHour ? 700 : 400 }}>
                          {isNowHour ? 'now' : hourLabel(h.time)}
                        </div>
                        <CondIcon condition={h.condition} size={15} color={hs.accent} />
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{displayHTemp}°</div>
                      </div>
                      {/* Mini precip probability bar */}
                      <div style={{ width: '100%', height: 4, background: 'rgba(0,0,0,0.05)' }}>
                        {barPct > 0.05 && (
                          <div style={{
                            height: '100%', width: `${Math.round(barPct * 100)}%`,
                            background: hs.barColor, opacity: 0.7,
                            borderRadius: '0 2px 2px 0',
                          }} />
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
          <div style={{ background: 'rgba(255,255,255,0.7)', borderRadius: 18, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.06)' }}>
            <div style={{ padding: '4px 16px 0' }}>
              <div style={{ fontSize: 11, color: '#aaa', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, padding: '12px 0 8px' }}>
                What to expect
              </div>
              {chunks.map((chunk, idx) => {
                const s = getStyle(chunk.condition, chunk.precip);
                const timeStr = chunk.isNow ? 'Now' : `+${chunk.start - nowMin} min`;
                return (
                  <div key={idx} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
                    borderBottom: idx < chunks.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none',
                    opacity: chunk.isNow ? 1 : 0.55,
                  }}>
                    <div style={{ width: 3, alignSelf: 'stretch', background: s.barColor, borderRadius: 2, flexShrink: 0 }} />
                    <CondIcon condition={chunk.condition} size={18} color={s.accent} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: '#1a1a1a' }}>{condLabelMap[chunk.condition]}</div>
                      <div style={{ fontSize: 12, color: '#999', marginTop: 1 }}>{chunkDesc(chunk.condition, chunk.isNow)}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: s.textAccent }}>{timeStr}</div>
                      <div style={{ fontSize: 11, color: '#bbb', marginTop: 1 }}>{chunk.duration}min</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ height: 1, background: 'rgba(0,0,0,0.07)', margin: '4px 0' }} />
            <div style={{ display: 'flex', padding: '14px 0 16px' }}>
              {[
                { label: 'Wind',  value: `${windLabel} ${displayWindUnit}` },
                { label: 'Humid', value: `${humidity}%` },
                { label: 'UV',    value: `${uvIndex} · ${uvLabel}` },
                { label: 'Vis',   value: displayVis },
              ].map((s, i, arr) => (
                <div key={s.label} style={{
                  flex: 1, textAlign: 'center',
                  borderRight: i < arr.length - 1 ? '1px solid rgba(0,0,0,0.08)' : 'none',
                }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: '#aaa', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
