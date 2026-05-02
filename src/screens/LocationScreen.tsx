import { useState, useEffect, useRef } from 'react';
import { CondIcon } from '../components/Icons';
import { DEFAULT_LOCATIONS, getStyle, CONDITION_STYLE, searchLocations } from '../weather';
import type { GeoResult } from '../weather';

interface SavedLocation {
  name: string;
  lat: number;
  lng: number;
}

interface Props {
  onBack: () => void;
  location: string;
  selectLocation: (name: string, lat: number, lng: number) => void;
  darkMode?: boolean;
}

const SAVED_KEY = 'soon-saved-locations';
const DEFAULT_SAVED: SavedLocation[] = [
  { name: 'San Francisco, CA', lat: 37.7749, lng: -122.4194 },
  { name: 'New York, NY',      lat: 40.7128, lng: -74.0060 },
];

function loadSaved(): SavedLocation[] {
  try { const v = localStorage.getItem(SAVED_KEY); return v ? JSON.parse(v) : DEFAULT_SAVED; } catch { return DEFAULT_SAVED; }
}

export function LocationScreen({ onBack, location, selectLocation, darkMode = false }: Props) {
  const [query, setQuery] = useState('');
  const [saved, setSaved] = useState<SavedLocation[]>(loadSaved);
  const [geoResults, setGeoResults] = useState<GeoResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [geoError, setGeoError] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try { localStorage.setItem(SAVED_KEY, JSON.stringify(saved)); } catch { /* quota */ }
  }, [saved]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) { setGeoResults([]); setSearching(false); setSearchError(false); return; }

    setSearching(true);
    setSearchError(false);
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await searchLocations(query);
        setGeoResults(results);
      } catch {
        setSearchError(true);
        setGeoResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const pick = (name: string, lat: number, lng: number) => {
    if (!saved.find(s => s.name === name)) {
      setSaved(s => [{ name, lat, lng }, ...s]);
    }
    selectLocation(name, lat, lng);
    onBack();
  };

  const removeSaved = (e: React.MouseEvent, name: string) => {
    e.stopPropagation();
    setSaved(s => s.filter(x => x.name !== name));
  };

  const formatGeoName = (r: GeoResult) =>
    r.admin1 ? `${r.name}, ${r.admin1}, ${r.country}` : `${r.name}, ${r.country}`;

  const bg = darkMode ? '#111318' : '#f7f5f2';
  const headerBg = darkMode ? '#1c1c28' : '#fff';
  const card = darkMode ? '#1c1c28' : '#fff';
  const border = darkMode ? 'rgba(255,255,255,0.13)' : 'rgba(0,0,0,0.13)';
  const divider = darkMode ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.09)';
  const text1 = darkMode ? '#f5f5f5' : '#0a0a0a';
  const text3 = darkMode ? '#a0a0a0' : '#5a5a5a';
  const chevron = darkMode ? '#666' : '#999';
  const backBtnBorder = darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.16)';
  const backBtnColor = darkMode ? '#d0d0d0' : '#3a3a3a';
  const searchBg = darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.07)';
  const activeRowBg = darkMode ? 'rgba(61,158,95,0.16)' : '#eef9f1';
  const iconBg = darkMode ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.06)';
  const removeBtnBg = darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
  const sectionLabel = darkMode ? '#a0a0a0' : '#5a5a5a';

  return (
    <div style={{ width: '100%', height: '100%', background: bg, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: 'var(--top-safe) 20px 16px', background: headerBg, borderBottom: `1px solid ${border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <button onClick={onBack} style={{
            background: 'none', border: `1.5px solid ${backBtnBorder}`, borderRadius: 22,
            padding: '8px 14px', color: backBtnColor, cursor: 'pointer', fontFamily: 'inherit',
            fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5, minHeight: 36,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            Back
          </button>
          <span style={{ fontSize: 19, fontWeight: 700, color: text1 }}>Locations</span>
        </div>
        <div style={{ position: 'relative' }}>
          <svg style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.55 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={text1} strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search any city…"
            autoFocus
            style={{
              width: '100%', padding: '13px 14px 13px 40px',
              background: searchBg, border: 'none', borderRadius: 11,
              fontSize: 16, fontWeight: 500, fontFamily: 'inherit', color: text1, outline: 'none',
            }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              background: darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)', border: 'none', borderRadius: '50%',
              width: 24, height: 24, cursor: 'pointer', color: darkMode ? '#fff' : '#222', fontSize: 13, fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit',
            }}>✕</button>
          )}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 24px' }}>

        {/* Search results */}
        {query ? (
          <>
            <div style={{ fontSize: 12, color: sectionLabel, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, margin: '20px 0 10px' }}>
              {searching ? 'Searching…' : searchError ? 'Search unavailable' : geoResults.length > 0 ? `Results for "${query}"` : 'No results'}
            </div>
            {geoResults.length > 0 && (
              <div style={{ background: card, borderRadius: 12, border: `1.5px solid ${border}`, overflow: 'hidden' }}>
                {geoResults.map((r, i) => {
                  const name = formatGeoName(r);
                  const isActive = location === name;
                  return (
                    <div key={`${r.lat},${r.lng}`} onClick={() => pick(name, r.lat, r.lng)} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', cursor: 'pointer', minHeight: 60,
                      borderBottom: i < geoResults.length - 1 ? `1px solid ${divider}` : 'none',
                      background: isActive ? activeRowBg : 'transparent',
                      transition: 'background 0.12s',
                    }}>
                      <div style={{ width: 38, height: 38, borderRadius: 11, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={text3} strokeWidth="2.2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 600, color: text1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: text3, marginTop: 2 }}>{r.admin1 ? `${r.admin1}, ` : ''}{r.country}</div>
                      </div>
                      {isActive
                        ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3d9e5f" strokeWidth="2.8" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                        : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={chevron} strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
                      }
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Use My Location */}
            <div style={{ fontSize: 12, color: sectionLabel, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, margin: '20px 0 10px' }}>Current location</div>
            {geoError && (
              <div style={{ fontSize: 14, fontWeight: 500, color: '#c0392b', background: darkMode ? 'rgba(192,57,43,0.18)' : '#fdf0ef', border: '1.5px solid #f5c6c3', borderRadius: 11, padding: '12px 14px', marginBottom: 10 }}>
                {geoError}
              </div>
            )}
            <div onClick={() => {
              setGeoError('');
              if (!navigator.geolocation) { setGeoError('Geolocation is not supported by your browser.'); return; }
              navigator.geolocation.getCurrentPosition(
                pos => { selectLocation('My Location', pos.coords.latitude, pos.coords.longitude); onBack(); },
                err => {
                  if (err.code === 1) setGeoError('Location access was denied. Enable it in your browser settings.');
                  else if (err.code === 2) setGeoError('Location unavailable. Check your device settings.');
                  else setGeoError('Could not get your location. Please try again.');
                }
              );
            }} style={{
              background: card, borderRadius: 12, border: `2px solid ${darkMode ? 'rgba(61,158,95,0.45)' : 'rgba(61,158,95,0.4)'}`,
              padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', minHeight: 60,
            }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: darkMode ? 'rgba(61,158,95,0.18)' : 'rgba(61,158,95,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#3d9e5f" strokeWidth="2.4" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="9" strokeDasharray="2 3"/></svg>
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: text1 }}>Use My Location</div>
                <div style={{ fontSize: 13, fontWeight: 500, color: text3, marginTop: 2 }}>Auto-detects where you are</div>
              </div>
              <svg style={{ marginLeft: 'auto' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={chevron} strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
            </div>

            {/* Saved */}
            {saved.length > 0 && (
              <>
                <div style={{ fontSize: 12, color: sectionLabel, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, margin: '20px 0 10px' }}>Saved</div>
                <div style={{ background: card, borderRadius: 12, border: `1.5px solid ${border}`, overflow: 'hidden' }}>
                  {saved.map((s, i) => {
                    const match = DEFAULT_LOCATIONS.find(l => `${l.city}, ${l.state}` === s.name);
                    const isActive = location === s.name;
                    return (
                      <div key={s.name} onClick={() => { selectLocation(s.name, s.lat, s.lng); onBack(); }} style={{
                        display: 'flex', alignItems: 'center', gap: 13, padding: '14px 16px', cursor: 'pointer', minHeight: 60,
                        borderBottom: i < saved.length - 1 ? `1px solid ${divider}` : 'none',
                        background: isActive ? activeRowBg : 'transparent',
                      }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: match?.condition ? getStyle(match.condition, 0).barColor : (darkMode ? '#555' : '#bbb'), flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 15, fontWeight: isActive ? 700 : 600, color: text1 }}>{s.name}</div>
                          {match?.condition && <div style={{ fontSize: 13, fontWeight: 500, color: text3, marginTop: 2 }}>{match.temp}° · {CONDITION_STYLE[match.condition]?.label}</div>}
                        </div>
                        {isActive && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3d9e5f" strokeWidth="2.8" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                        <button onClick={e => removeSaved(e, s.name)} style={{
                          background: removeBtnBg, border: 'none', borderRadius: '50%',
                          width: 28, height: 28, cursor: 'pointer', color: darkMode ? '#bbb' : '#555', fontSize: 13, fontWeight: 600,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>✕</button>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Popular cities */}
            <div style={{ fontSize: 12, color: sectionLabel, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, margin: '20px 0 10px' }}>Popular cities</div>
            <div style={{ background: card, borderRadius: 12, border: `1.5px solid ${border}`, overflow: 'hidden' }}>
              {DEFAULT_LOCATIONS.map((loc, i) => {
                const full = `${loc.city}, ${loc.state}`;
                const isActive = location === full;
                const cs = getStyle(loc.condition!, 0.5);
                return (
                  <div key={full} onClick={() => pick(full, loc.lat, loc.lng)} style={{
                    display: 'flex', alignItems: 'center', gap: 13, padding: '14px 16px', cursor: 'pointer', minHeight: 60,
                    borderBottom: i < DEFAULT_LOCATIONS.length - 1 ? `1px solid ${divider}` : 'none',
                    background: isActive ? activeRowBg : 'transparent',
                    transition: 'background 0.12s',
                  }}>
                    <div style={{ width: 38, height: 38, borderRadius: 11, background: cs.barColor + (darkMode ? '28' : '22'), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <CondIcon condition={loc.condition!} size={18} color={cs.accent} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: text1 }}>{loc.city}, {loc.state}</div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: text3, marginTop: 2 }}>{loc.temp}° · {cs.label}</div>
                    </div>
                    {isActive
                      ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3d9e5f" strokeWidth="2.8" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                      : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={chevron} strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
                    }
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
