import { useState, useRef, useCallback } from 'react';
import { CondIcon } from '../components/Icons';
import { getStyle, timeLabel } from '../weather';
import type { MinuteForecast, CurrentConditions } from '../types';

interface Props {
  onSettings: () => void;
  nowMin: number;
  setNowMin: (n: number) => void;
  forecast: MinuteForecast[];
  location: string;
  currentConditions: CurrentConditions | null;
}

export function HomeScreen({ onSettings, nowMin, setNowMin, forecast, location, currentConditions }: Props) {
  const current = forecast[nowMin];
  const cs = getStyle(current.condition, current.precip);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [hoveredMin, setHoveredMin] = useState<number | null>(null);

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
    if (current.condition === 'clear') return 'Clear skies for the rest of the hour';
    for (let i = nowMin + 1; i < 60; i++) {
      if (forecast[i].condition === 'clear' || forecast[i].condition === 'clearing') {
        return `Clears up in ${i - nowMin} min`;
      }
    }
    return 'Rain continues through the hour';
  })();

  const handleTimelineInteract = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    setNowMin(Math.round(pct * 59));
  }, [setNowMin]);

  const feelsLike = currentConditions?.feelsLike ?? Math.round(current.temp - current.precip * 5);
  const wind      = currentConditions?.windSpeed  ?? (current.condition === 'rain' ? 14 : current.condition === 'drizzle' ? 8 : 4);
  const humidity  = currentConditions?.humidity   ?? (current.condition === 'rain' ? 91 : current.condition === 'drizzle' ? 79 : 54);
  const uvIndex   = currentConditions?.uvIndex    ?? (current.condition === 'clear' ? 4 : 1);
  const visibility = currentConditions?.visibility ?? (current.condition === 'rain' ? 1 : 10);

  const condLabelMap: Record<string, string> = { rain: 'Rain', drizzle: 'Drizzle', clearing: 'Clearing', clear: 'Clear' };
  const descMap: Record<string, string> = { rain: 'Keep an umbrella handy', drizzle: 'Light mist in the air', clearing: 'Skies brightening', clear: 'Great time to head out' };

  return (
    <div style={{
      width: '100%', height: '100%',
      background: cs.bg,
      display: 'flex', flexDirection: 'column',
      transition: 'background 0.9s ease',
      overflow: 'hidden',
    }}>

      {/* HEADER */}
      <div style={{ padding: '62px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: 11, color: '#999', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500 }}>Now in</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#1a1a1a', letterSpacing: '-0.02em', marginTop: 1 }}>
            {location ? location.split(',')[0] : 'San Francisco'}
          </div>
        </div>
        <button onClick={onSettings} style={{
          background: 'none', border: '1.5px solid rgba(0,0,0,0.12)',
          borderRadius: 20, padding: '6px 13px',
          color: '#555', cursor: 'pointer', fontSize: 13,
          fontFamily: 'inherit', fontWeight: 500,
          display: 'flex', alignItems: 'center', gap: 5,
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
          {timeLabel(0)}
        </button>
      </div>

      {/* HERO TEMP */}
      <div style={{ padding: '20px 22px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: cs.accent + '18', borderRadius: 6,
            padding: '4px 10px 4px 7px', marginBottom: 10,
            transition: 'background 0.8s',
          }}>
            <CondIcon condition={current.condition} size={14} color={cs.accent} />
            <span style={{ fontSize: 12, fontWeight: 600, color: cs.textAccent, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              {cs.label}
            </span>
          </div>
          <div style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 86, fontWeight: 300,
            color: '#1a1a1a',
            lineHeight: 1, letterSpacing: '-0.03em',
            transition: 'color 0.6s',
          }}>
            {Math.round(current.temp)}
            <span style={{ fontSize: 44, fontWeight: 300, verticalAlign: 'top', marginTop: 12, display: 'inline-block' }}>°F</span>
          </div>
          <div style={{ color: '#888', fontSize: 13, marginTop: 5, fontWeight: 400 }}>
            Feels like {feelsLike}° · {humidity}% humidity
          </div>
        </div>
        <div style={{ paddingTop: 28, opacity: 0.8 }}>
          <CondIcon condition={current.condition} size={50} color={cs.accent} />
        </div>
      </div>

      {/* NEXT EVENT CALLOUT */}
      <div style={{ margin: '16px 22px 0' }}>
        <div style={{
          background: '#fff', borderRadius: 12, padding: '11px 16px',
          border: `1.5px solid ${cs.accent}30`,
          display: 'flex', alignItems: 'center', gap: 10,
          transition: 'border-color 0.8s',
        }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: cs.barColor, flexShrink: 0 }} />
          <span style={{ fontSize: 14, fontWeight: 500, color: '#2a2a2a' }}>{nextEvent}</span>
        </div>
      </div>

      {/* 60-MIN TIMELINE */}
      <div style={{ margin: '20px 0 0', padding: '0 22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 9 }}>
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
          onMouseMove={(e) => {
            const rect = timelineRef.current!.getBoundingClientRect();
            setHoveredMin(Math.round(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) * 59));
          }}
          onMouseLeave={() => setHoveredMin(null)}
          style={{
            width: '100%', height: 64, cursor: 'crosshair',
            background: 'rgba(0,0,0,0.04)',
            borderRadius: 10, overflow: 'hidden',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', height: '100%', alignItems: 'flex-end', gap: 1.5, padding: '0 2px' }}>
            {forecast.map((m, i) => {
              const s = getStyle(m.condition, m.precip);
              const barH = m.precip > 0 ? 16 + m.precip * 56 : 6;
              const isPast = i < nowMin;
              const isHovered = hoveredMin === i;
              return (
                <div key={i} style={{
                  flex: 1, minWidth: 2,
                  height: `${Math.round(barH)}px`,
                  background: s.barColor,
                  borderRadius: '3px 3px 0 0',
                  opacity: isPast ? 0.18 : isHovered ? 1 : 0.78,
                  transition: 'opacity 0.12s',
                }} />
              );
            })}
          </div>
          {/* NOW line */}
          <div style={{
            position: 'absolute', top: 0, bottom: 0,
            left: `calc(${(nowMin / 59) * 100}% - 1px)`,
            width: 2, background: '#1a1a1a', borderRadius: 1,
            transition: 'left 0.35s ease',
          }}>
            <div style={{
              position: 'absolute', top: -1, left: '50%',
              transform: 'translateX(-50%)',
              width: 7, height: 7, borderRadius: '50%',
              background: '#1a1a1a',
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

      {/* STORY LIST */}
      <div style={{ flex: 1, padding: '16px 22px 0', overflowY: 'auto' }}>
        <div style={{ fontSize: 11, color: '#aaa', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, marginBottom: 10 }}>
          What to expect
        </div>
        {chunks.map((chunk, idx) => {
          const s = getStyle(chunk.condition, chunk.precip);
          const timeStr = chunk.isNow ? 'Now' : `+${chunk.start - nowMin} min`;
          return (
            <div key={idx} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '9px 0',
              borderBottom: idx < chunks.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none',
              opacity: chunk.isNow ? 1 : 0.6,
              transition: 'opacity 0.3s',
            }}>
              <div style={{ width: 3, alignSelf: 'stretch', background: s.barColor, borderRadius: 2, flexShrink: 0 }} />
              <CondIcon condition={chunk.condition} size={20} color={s.accent} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#1a1a1a' }}>{condLabelMap[chunk.condition]}</div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 1 }}>{descMap[chunk.condition]}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: s.textAccent }}>{timeStr}</div>
                <div style={{ fontSize: 11, color: '#bbb', marginTop: 1 }}>{chunk.duration}min</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* STATS ROW */}
      <div style={{ padding: '14px 22px 16px', display: 'flex', gap: 0 }}>
        {[
          { label: 'Wind',  value: `${wind} mph` },
          { label: 'Humid', value: `${humidity}%` },
          { label: 'UV',    value: uvIndex <= 2 ? `${uvIndex} low` : uvIndex <= 5 ? `${uvIndex} mod` : `${uvIndex} high` },
          { label: 'Vis',   value: `${visibility}mi` },
        ].map((s, i, arr) => (
          <div key={s.label} style={{
            flex: 1, textAlign: 'center',
            borderRight: i < arr.length - 1 ? '1px solid rgba(0,0,0,0.08)' : 'none',
            padding: '2px 0',
          }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#1a1a1a' }}>{s.value}</div>
            <div style={{ fontSize: 10, color: '#aaa', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center', paddingBottom: 8, fontSize: 10, color: '#ccc', letterSpacing: '0.05em' }}>
        tap timeline to scrub · min {nowMin}
      </div>
    </div>
  );
}
