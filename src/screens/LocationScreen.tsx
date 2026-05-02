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
  const headerBg = darkMode ? '#1a1a24' : '#fff';
  const card = darkMode ? '#1a1a24' : '#fff';
  const border = darkMode ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.08)';
  const divider = darkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';
  const text1 = darkMode ? '#f0f0f0' : '#1a1a1a';
  const text3 = darkMode ? '#777' : '#aaa';
  const chevron = darkMode ? '#444' : '#ccc';
  const backBtnBorder = darkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)';
  const backBtnColor = darkMode ? '#aaa' : '#555';
  const searchBg = darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)';
  const activeRowBg = darkMode ? 'rgba(61,158,95,0.1)' : '#f7fbf8';
  const iconBg = darkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)';
  const removeBtnBg = darkMode ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.06)';
  const sectionLabel = darkMode ? '#777' : '#aaa';

  return (
    <div style={{ width: '100%', height: '100%', background: bg, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: 'var(--top-safe) 20px 14px', background: headerBg, borderBottom: `1px solid ${border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <button onClick={onBack} style={{
            background: 'none', border: `1.5px solid ${backBtnBorder}`, borderRadius: 20,
            padding: '5px 12px', color: backBtnColor, cursor: 'pointer', fontFamily: 'inherit',
            fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            Back
          </button>
          <span style={{ fontSize: 17, fontWeight: 600, color: text1 }}>Locations</span>
        </div>
        <div style={{ position: 'relative' }}>
          <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.35 }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={text1} strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search any city…"
            autoFocus
            style={{
              width: '100%', padding: '10px 12px 10px 34px',
              background: searchBg, border: 'none', borderRadius: 10,
              fontSize: 14, fontFamily: 'inherit', color: text1, outline: 'none',
            }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{
              position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
              background: darkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)', border: 'none', borderRadius: '50%',
              width: 18, height: 18, cursor: 'pointer', color: darkMode ? '#bbb' : '#555', fontSize: 11,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit',
            }}>✕</button>
          )}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 24px' }}>

        {/* Search results */}
        {query ? (
          <>
            <div style={{ fontSize: 11, color: sectionLabel, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, margin: '18px 0 8px' }}>
              {searching ? 'Searching…' : searchError ? 'Search unavailable' : geoResults.length > 0 ? `Results for "${query}"` : 'No results'}
            </div>
            {geoResults.length > 0 && (
              <div style={{ background: card, borderRadius: 12, border: `1px solid ${border}`, overflow: 'hidden' }}>
                {geoResults.map((r, i) => {
                  const name = formatGeoName(r);
                  const isActive = location === name;
                  return (
                    <div key={`${r.lat},${r.lng}`} onClick={() => pick(name, r.lat, r.lng)} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', cursor: 'pointer',
                      borderBottom: i < geoResults.length - 1 ? `1px solid ${divider}` : 'none',
                      background: isActive ? activeRowBg : 'transparent',
                      transition: 'background 0.12s',
                    }}>
                      <div style={{ width: 34, height: 34, borderRadius: 10, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={text3} strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 500, color: text1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</div>
                        <div style={{ fontSize: 12, color: text3, marginTop: 1 }}>{r.admin1 ? `${r.admin1}, ` : ''}{r.country}</div>
                      </div>
                      {isActive
                        ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3d9e5f" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                        : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={chevron} strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
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
            <div style={{ fontSize: 11, color: sectionLabel, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, margin: '18px 0 8px' }}>Current location</div>
            {geoError && (
              <div style={{ fontSize: 13, color: '#c0392b', background: darkMode ? 'rgba(192,57,43,0.15)' : '#fdf0ef', border: '1px solid #f5c6c3', borderRadius: 10, padding: '10px 14px', marginBottom: 10 }}>
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
              background: card, borderRadius: 12, border: `1.5px solid ${darkMode ? 'rgba(61,158,95,0.25)' : '#3d9e5f33'}`,
              padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
            }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: darkMode ? 'rgba(61,158,95,0.12)' : '#3d9e5f15', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3d9e5f" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="9" strokeDasharray="2 3"/></svg>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: text1 }}>Use My Location</div>
                <div style={{ fontSize: 12, color: text3, marginTop: 1 }}>Auto-detects where you are</div>
              </div>
              <svg style={{ marginLeft: 'auto' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={chevron} strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
            </div>

            {/* Saved */}
            {saved.length > 0 && (
              <>
                <div style={{ fontSize: 11, color: sectionLabel, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, margin: '18px 0 8px' }}>Saved</div>
                <div style={{ background: card, borderRadius: 12, border: `1px solid ${border}`, overflow: 'hidden' }}>
                  {saved.map((s, i) => {
                    const match = DEFAULT_LOCATIONS.find(l => `${l.city}, ${l.state}` === s.name);
                    const isActive = location === s.name;
                    return (
                      <div key={s.name} onClick={() => { selectLocation(s.name, s.lat, s.lng); onBack(); }} style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', cursor: 'pointer',
                        borderBottom: i < saved.length - 1 ? `1px solid ${divider}` : 'none',
                        background: isActive ? activeRowBg : 'transparent',
                      }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: match?.condition ? getStyle(match.condition, 0).barColor : (darkMode ? '#444' : '#ccc'), flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: isActive ? 600 : 400, color: text1 }}>{s.name}</div>
                          {match?.condition && <div style={{ fontSize: 12, color: text3, marginTop: 1 }}>{match.temp}° · {CONDITION_STYLE[match.condition]?.label}</div>}
                        </div>
                        {isActive && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3d9e5f" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                        <button onClick={e => removeSaved(e, s.name)} style={{
                          background: removeBtnBg, border: 'none', borderRadius: '50%',
                          width: 22, height: 22, cursor: 'pointer', color: text3, fontSize: 12,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>✕</button>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Popular cities */}
            <div style={{ fontSize: 11, color: sectionLabel, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, margin: '18px 0 8px' }}>Popular cities</div>
            <div style={{ background: card, borderRadius: 12, border: `1px solid ${border}`, overflow: 'hidden' }}>
              {DEFAULT_LOCATIONS.map((loc, i) => {
                const full = `${loc.city}, ${loc.state}`;
                const isActive = location === full;
                const cs = getStyle(loc.condition!, 0.5);
                return (
                  <div key={full} onClick={() => pick(full, loc.lat, loc.lng)} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', cursor: 'pointer',
                    borderBottom: i < DEFAULT_LOCATIONS.length - 1 ? `1px solid ${divider}` : 'none',
                    background: isActive ? activeRowBg : 'transparent',
                    transition: 'background 0.12s',
                  }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: cs.barColor + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <CondIcon condition={loc.condition!} size={16} color={cs.accent} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: text1 }}>{loc.city}, {loc.state}</div>
                      <div style={{ fontSize: 12, color: text3, marginTop: 1 }}>{loc.temp}° · {cs.label}</div>
                    </div>
                    {isActive
                      ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3d9e5f" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                      : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={chevron} strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
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
