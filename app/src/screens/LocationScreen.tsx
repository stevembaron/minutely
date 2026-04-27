import { useState } from 'react';
import { CondIcon } from '../components/Icons';
import { DEFAULT_LOCATIONS, getStyle, CONDITION_STYLE } from '../weather';

interface Props {
  onBack: () => void;
  location: string;
  setLocation: (loc: string) => void;
}

export function LocationScreen({ onBack, location, setLocation }: Props) {
  const [query, setQuery] = useState('');
  const [saved, setSaved] = useState(['San Francisco, CA', 'New York, NY']);

  const filtered = DEFAULT_LOCATIONS.filter(l =>
    `${l.city} ${l.state}`.toLowerCase().includes(query.toLowerCase())
  );

  const pick = (city: string, state: string) => {
    const full = `${city}, ${state}`;
    if (!saved.includes(full)) setSaved(s => [full, ...s]);
    setLocation(full);
    onBack();
  };

  const removeSaved = (e: React.MouseEvent, loc: string) => {
    e.stopPropagation();
    setSaved(s => s.filter(x => x !== loc));
    if (location === loc) setLocation('San Francisco, CA');
  };

  return (
    <div style={{ width: '100%', height: '100%', background: '#f7f5f2', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '62px 20px 14px', background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <button onClick={onBack} style={{
            background: 'none', border: '1.5px solid rgba(0,0,0,0.12)', borderRadius: 20,
            padding: '5px 12px', color: '#555', cursor: 'pointer', fontFamily: 'inherit',
            fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            Back
          </button>
          <span style={{ fontSize: 17, fontWeight: 600, color: '#1a1a1a' }}>Locations</span>
        </div>
        <div style={{ position: 'relative' }}>
          <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.35 }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search cities…"
            style={{
              width: '100%', padding: '10px 12px 10px 34px',
              background: 'rgba(0,0,0,0.05)', border: 'none', borderRadius: 10,
              fontSize: 14, fontFamily: 'inherit', color: '#1a1a1a', outline: 'none',
            }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{
              position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
              background: 'rgba(0,0,0,0.15)', border: 'none', borderRadius: '50%',
              width: 18, height: 18, cursor: 'pointer', color: '#555', fontSize: 11,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit',
            }}>✕</button>
          )}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 24px' }}>

        {!query && (
          <>
            <div style={{ fontSize: 11, color: '#aaa', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, margin: '18px 0 8px' }}>Current location</div>
            <div onClick={() => { setLocation('Current Location'); onBack(); }} style={{
              background: '#fff', borderRadius: 12, border: '1.5px solid #3d9e5f33',
              padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
            }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: '#3d9e5f15', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3d9e5f" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="9" strokeDasharray="2 3"/></svg>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#1a1a1a' }}>Use My Location</div>
                <div style={{ fontSize: 12, color: '#aaa', marginTop: 1 }}>Auto-detects where you are</div>
              </div>
              <svg style={{ marginLeft: 'auto' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
            </div>
          </>
        )}

        {!query && saved.length > 0 && (
          <>
            <div style={{ fontSize: 11, color: '#aaa', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, margin: '18px 0 8px' }}>Saved</div>
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid rgba(0,0,0,0.08)', overflow: 'hidden' }}>
              {saved.map((loc, i) => {
                const match = DEFAULT_LOCATIONS.find(l => `${l.city}, ${l.state}` === loc);
                const isActive = location === loc;
                return (
                  <div key={loc} onClick={() => { setLocation(loc); onBack(); }} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', cursor: 'pointer',
                    borderBottom: i < saved.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none',
                    background: isActive ? '#f7fbf8' : 'transparent',
                  }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: match?.condition ? getStyle(match.condition, 0).barColor : '#ccc', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: isActive ? 600 : 400, color: '#1a1a1a' }}>{loc}</div>
                      {match?.condition && <div style={{ fontSize: 12, color: '#aaa', marginTop: 1 }}>{match.temp}° · {CONDITION_STYLE[match.condition]?.label}</div>}
                    </div>
                    {isActive && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3d9e5f" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                    <button onClick={e => removeSaved(e, loc)} style={{
                      background: 'rgba(0,0,0,0.06)', border: 'none', borderRadius: '50%',
                      width: 22, height: 22, cursor: 'pointer', color: '#888', fontSize: 12,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>✕</button>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <div style={{ fontSize: 11, color: '#aaa', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, margin: '18px 0 8px' }}>
          {query ? `Results for "${query}"` : 'Popular cities'}
        </div>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: '#bbb', fontSize: 14 }}>No cities found</div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid rgba(0,0,0,0.08)', overflow: 'hidden' }}>
            {filtered.map((loc, i) => {
              const full = `${loc.city}, ${loc.state}`;
              const isActive = location === full;
              const cs = getStyle(loc.condition!, 0.5);
              return (
                <div key={full} onClick={() => pick(loc.city, loc.state)} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', cursor: 'pointer',
                  borderBottom: i < filtered.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none',
                  background: isActive ? '#f7fbf8' : 'transparent',
                  transition: 'background 0.12s',
                }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: cs.barColor + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <CondIcon condition={loc.condition!} size={16} color={cs.accent} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#1a1a1a' }}>{loc.city}, {loc.state}</div>
                    <div style={{ fontSize: 12, color: '#aaa', marginTop: 1 }}>{loc.temp}° · {cs.label}</div>
                  </div>
                  {isActive
                    ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3d9e5f" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
                  }
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
