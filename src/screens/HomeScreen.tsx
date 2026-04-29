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

export function HomeScreen({ onSettings, nowMin, setNowMin, forecast, hourlyForecast, location, currentConditions, settings, lastUpdated, refreshing, fetchError, onRefresh }: Props) {
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

  const feelsLikeF = currentConditions?.feelsLike ?? Math.round(current.temp - current.precip * 5);
  const windMph    = currentConditions?.windSpeed  ?? (current.condition === 'rain' ? 14 : current.condition === 'drizzle' ? 8 : 4);
  const humidity   = currentConditions?.humidity   ?? (current.condition === 'rain' ? 91 : current.condition === 'drizzle' ? 79 : 54);
  const uvIndex    = currentConditions?.uvIndex    ?? (current.condition === 'clear' ? 4 : 1);
  const visMi      = currentConditions?.visibility ?? (current.condition === 'rain' ? 1 : 10);

  const displayTemp     = useCelsius ? fToC(current.temp) : Math.round(current.temp);
  const displayFeels    = useCelsius ? fToC(feelsLikeF) : feelsLikeF;
  const displayWind     = useKph ? mphToKph(windMph) : windMph;
  const displayWindUnit = useKph ? 'km/h' : 'mph';
  const displayVis      = useKph ? `${miToKm(visMi)}km` : `${visMi}mi`;
  const tempUnit        = settings.tempUnit;

  const todayTemps = hourlyForecast.slice(0, 24).map(h => useCelsius ? fToC(h.temp) : Math.round(h.temp));
  const highTemp = todayTemps.length > 0 ? Math.max(...todayTemps) : null;
  const lowTemp  = todayTemps.length > 0 ? Math.min(...todayTemps) : null;

  const condLabelMap: Record<string, string> = { rain: 'Rain', drizzle: 'Drizzle', clearing: 'Clearing', clear: 'Clear' };
  const descMap: Record<string, string> = { rain: 'Keep an umbrella handy', drizzle: 'Light mist in the air', clearing: 'Skies brightening', clear: 'Great time to head out' };
  const uvLabel = uvIndex <= 2 ? 'Low' : uvIndex <= 5 ? 'Moderate' : uvIndex <= 7 ? 'High' : 'Very High';
  const isStale = lastUpdated != null && (Date.now() - lastUpdated.getTime()) > 25 * 60 * 1000;

  return (
    <div style={{
      width: '100%', height: '100%',
      background: cs.bg,
      display: 'flex', flexDirection: 'column',
      transition: 'background 0.9s ease',
      overflow: 'hidden',
    }}>

      {/* HEADER */}
      <div style={{
        padding: 'max(env(safe-area-inset-top), 20px) 22px 0',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: 11, color: '#aaa', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, marginBottom: 2 }}>
            Now in
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            {location ? location.split(',')[0] : 'My Location'}
          </div>
        </div>
        <button onClick={onSettings} style={{
          background: 'rgba(0,0,0,0.06)', border: 'none',
          borderRadius: '50%', width: 36, height: 36,
          color: '#666', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>
      </div>

      {/* HERO */}
      <div style={{ padding: '20px 22px 0', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          {/* Condition badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: cs.accent + '18', borderRadius: 6,
            padding: '4px 10px 4px 7px', marginBottom: 14,
            transition: 'background 0.8s',
          }}>
            <CondIcon condition={current.condition} size={13} color={cs.accent} />
            <span style={{ fontSize: 11, fontWeight: 700, color: cs.textAccent, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
              {cs.label}
            </span>
          </div>

          {/* Temperature */}
          <div style={{ display: 'flex', alignItems: 'flex-start', lineHeight: 1 }}>
            <div style={{ fontSize: 88, fontWeight: 300, color: '#1a1a1a', letterSpacing: '-0.04em' }}>
              {displayTemp}
            </div>
            <div style={{ fontSize: 38, fontWeight: 300, color: '#1a1a1a', marginTop: 12, marginLeft: 2 }}>
              {tempUnit}
            </div>
          </div>

          {/* Feels like + high/low */}
          <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ color: '#888', fontSize: 13, fontWeight: 400 }}>
              Feels like {displayFeels}° · {humidity}% humidity
            </div>
            {highTemp !== null && lowTemp !== null && (
              <div style={{ color: '#aaa', fontSize: 12 }}>
                H: {highTemp}° &nbsp; L: {lowTemp}°
              </div>
            )}
          </div>
        </div>

        {/* Big condition icon */}
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
          backdropFilter: 'blur(8px)',
          transition: 'border-color 0.8s',
        }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: cs.barColor, flexShrink: 0 }} />
          <span style={{ fontSize: 14, fontWeight: 500, color: '#1e1e1e', flex: 1 }}>{nextEvent}</span>
          <button onClick={onRefresh} disabled={refreshing} style={{
            background: 'none', border: 'none', cursor: refreshing ? 'default' : 'pointer',
            padding: 4, color: '#ccc', display: 'flex', alignItems: 'center',
            opacity: refreshing ? 0.4 : 1, transition: 'opacity 0.2s',
            flexShrink: 0,
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
            {hoveredMin !== null
              ? `${timeLabel(hoveredMin - nowMin)} · +${hoveredMin - nowMin}min`
              : `${timeLabel(0)} → ${timeLabel(60 - nowMin, true)}`}
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
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 'max(env(safe-area-inset-bottom), 20px)', marginTop: 18 }}>

        {/* HOURLY FORECAST */}
        {hourlyForecast.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: '#aaa', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, margin: '0 22px 10px' }}>
              24-hour forecast
            </div>
            <div style={{ overflowX: 'auto', paddingLeft: 22, paddingRight: 22, scrollbarWidth: 'none' }}>
              <div style={{ display: 'flex', gap: 8, paddingBottom: 4 }}>
                {hourlyForecast.map((h, i) => {
                  const hs = getStyle(h.condition, h.precip);
                  const displayHTemp = useCelsius ? fToC(h.temp) : Math.round(h.temp);
                  const isNowHour = i === 0;
                  return (
                    <div key={i} style={{
                      flexShrink: 0, width: 60,
                      background: isNowHour ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.5)',
                      borderRadius: 14, padding: '11px 0 10px',
                      border: isNowHour ? `1.5px solid ${cs.accent}35` : '1.5px solid transparent',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                    }}>
                      <div style={{ fontSize: 11, color: isNowHour ? cs.textAccent : '#999', fontWeight: isNowHour ? 700 : 400 }}>
                        {isNowHour ? 'now' : hourLabel(h.time)}
                      </div>
                      <CondIcon condition={h.condition} size={16} color={hs.accent} />
                      <div style={{ fontSize: 14, fontWeight: 500, color: '#1a1a1a' }}>{displayHTemp}°</div>
                      <div style={{ fontSize: 10, color: h.precipProb > 10 ? hs.textAccent : 'transparent', fontWeight: 500, minHeight: 14 }}>
                        {h.precipProb > 10 ? `${h.precipProb}%` : ''}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* DETAIL CARD: What to expect + stats */}
        <div style={{ margin: '0 22px' }}>
          <div style={{ background: 'rgba(255,255,255,0.7)', borderRadius: 18, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.06)' }}>

            {/* Story chunks */}
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
                      <div style={{ fontSize: 12, color: '#999', marginTop: 1 }}>{descMap[chunk.condition]}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: s.textAccent }}>{timeStr}</div>
                      <div style={{ fontSize: 11, color: '#bbb', marginTop: 1 }}>{chunk.duration}min</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: 'rgba(0,0,0,0.07)', margin: '4px 0' }} />

            {/* Stats row */}
            <div style={{ display: 'flex', padding: '14px 0 16px' }}>
              {[
                { label: 'Wind',  value: `${displayWind} ${displayWindUnit}` },
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
