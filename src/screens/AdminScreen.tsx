import { SCENARIOS } from '../weather';
import type { ScenarioKey } from '../types';

interface Props {
  onBack: () => void;
  scenario: ScenarioKey;
  setScenario: (k: ScenarioKey) => void;
  nowMin: number;
  setNowMin: (n: number) => void;
  onRebuild: (key: ScenarioKey) => void;
  location: string;
  setLocation: (loc: string) => void;
  tempOffset: number;
  setTempOffset: (n: number) => void;
}

const ADMIN_LOCATIONS = ['San Francisco, CA', 'New York, NY', 'Chicago, IL', 'Miami, FL', 'Seattle, WA', 'Austin, TX'];
const DOT_COLORS: Record<ScenarioKey, string> = {
  rain_clearing: '#c94f2a', all_clear: '#3d9e5f', storm_incoming: '#b03020', steady_rain: '#a83e1e', drizzle: '#d4a017',
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, color: '#aaa', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, margin: '20px 0 8px' }}>
      {children}
    </div>
  );
}

export function AdminScreen({ onBack, scenario, setScenario, nowMin, setNowMin, onRebuild, location, setLocation, tempOffset, setTempOffset }: Props) {
  return (
    <div style={{ width: '100%', height: '100%', background: '#f2f0ed', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: 'max(env(safe-area-inset-top), 54px) 20px 14px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid rgba(0,0,0,0.08)', background: '#fff' }}>
        <button onClick={onBack} style={{
          background: 'none', border: '1.5px solid rgba(0,0,0,0.12)', borderRadius: 20,
          padding: '5px 12px', color: '#555', cursor: 'pointer', fontFamily: 'inherit',
          fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Back
        </button>
        <div>
          <div style={{ fontSize: 17, fontWeight: 600, color: '#1a1a1a', letterSpacing: '-0.02em' }}>Admin</div>
          <div style={{ fontSize: 11, color: '#aaa', marginTop: 1 }}>Mock data controls</div>
        </div>
        <div style={{ marginLeft: 'auto', background: '#1a1a1a', borderRadius: 20, padding: '3px 10px' }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: '#fff', letterSpacing: '0.08em' }}>DEV</span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 24px' }}>

        <SectionLabel>Weather scenario</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(Object.entries(SCENARIOS) as [ScenarioKey, typeof SCENARIOS[ScenarioKey]][]).map(([key, s]) => {
            const active = scenario === key;
            return (
              <button key={key} onClick={() => { setScenario(key); onRebuild(key); }} style={{
                background: active ? '#1a1a1a' : '#fff',
                border: `1.5px solid ${active ? '#1a1a1a' : 'rgba(0,0,0,0.10)'}`,
                borderRadius: 12, padding: '11px 14px',
                display: 'flex', alignItems: 'center', gap: 11,
                cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                transition: 'all 0.18s',
              }}>
                <div style={{ width: 9, height: 9, borderRadius: '50%', background: active ? '#fff' : DOT_COLORS[key], flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: active ? '#fff' : '#1a1a1a' }}>{s.label}</div>
                  <div style={{ fontSize: 12, color: active ? 'rgba(255,255,255,0.55)' : '#aaa', marginTop: 1 }}>{s.desc}</div>
                </div>
                {active && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
              </button>
            );
          })}
        </div>

        <SectionLabel>Current minute ({nowMin} / 59)</SectionLabel>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid rgba(0,0,0,0.08)', padding: '16px' }}>
          <input type="range" min="0" max="59" value={nowMin} onChange={e => setNowMin(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#1a1a1a', cursor: 'pointer' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <span style={{ fontSize: 11, color: '#bbb' }}>0 min</span>
            <span style={{ fontSize: 11, color: '#1a1a1a', fontWeight: 600 }}>+{nowMin} min now</span>
            <span style={{ fontSize: 11, color: '#bbb' }}>59 min</span>
          </div>
        </div>

        <SectionLabel>Temperature offset ({tempOffset > 0 ? '+' : ''}{tempOffset}°)</SectionLabel>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid rgba(0,0,0,0.08)', padding: '16px' }}>
          <input type="range" min="-20" max="20" value={tempOffset} onChange={e => setTempOffset(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#1a1a1a', cursor: 'pointer' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <span style={{ fontSize: 11, color: '#bbb' }}>−20°</span>
            <button onClick={() => setTempOffset(0)} style={{ fontSize: 11, color: '#aaa', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Reset</button>
            <span style={{ fontSize: 11, color: '#bbb' }}>+20°</span>
          </div>
        </div>

        <SectionLabel>Mock location</SectionLabel>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          {ADMIN_LOCATIONS.map((loc, i) => (
            <div key={loc} onClick={() => setLocation(loc)} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px', cursor: 'pointer',
              borderBottom: i < ADMIN_LOCATIONS.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none',
              background: location === loc ? '#f7f5f2' : 'transparent',
              transition: 'background 0.15s',
            }}>
              <span style={{ fontSize: 14, color: '#1a1a1a', fontWeight: location === loc ? 500 : 400 }}>{loc}</span>
              {location === loc && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3d9e5f" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
            </div>
          ))}
        </div>

        <SectionLabel>Data status</SectionLabel>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid rgba(0,0,0,0.08)', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { key: 'Source',    val: 'Pirate Weather API' },
            { key: 'Refreshed', val: 'Just now' },
            { key: 'Provider',  val: 'pirateweather.net' },
            { key: 'Lat/Lng',   val: '37.77°N 122.42°W' },
          ].map(row => (
            <div key={row.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#aaa' }}>{row.key}</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a', fontFamily: 'monospace' }}>{row.val}</span>
            </div>
          ))}
          <button onClick={() => onRebuild(scenario)} style={{
            marginTop: 6, background: '#1a1a1a', border: 'none', borderRadius: 8,
            padding: '9px 0', color: '#fff', fontSize: 13, fontWeight: 500,
            fontFamily: 'inherit', cursor: 'pointer', width: '100%',
          }}>
            ↻ Rebuild mock data
          </button>
        </div>

      </div>
    </div>
  );
}
