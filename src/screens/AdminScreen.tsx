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
  darkMode?: boolean;
}

const ADMIN_LOCATIONS = ['San Francisco, CA', 'New York, NY', 'Chicago, IL', 'Miami, FL', 'Seattle, WA', 'Austin, TX'];
const DOT_COLORS: Record<ScenarioKey, string> = {
  rain_clearing: '#c94f2a', all_clear: '#3d9e5f', storm_incoming: '#b03020', steady_rain: '#a83e1e', drizzle: '#d4a017',
  snow_clearing: '#6b8caf', snowstorm: '#3d5d80', sleet_mix: '#8b7da8',
};

function SectionLabel({ children, dark }: { children: React.ReactNode; dark: boolean }) {
  return (
    <div style={{ fontSize: 12, color: dark ? '#a0a0a0' : '#5a5a5a', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, margin: '22px 0 10px' }}>
      {children}
    </div>
  );
}

export function AdminScreen({ onBack, scenario, setScenario, nowMin, setNowMin, onRebuild, location, setLocation, tempOffset, setTempOffset, darkMode = false }: Props) {
  const bg = darkMode ? '#111318' : '#f2f0ed';
  const headerBg = darkMode ? '#1c1c28' : '#fff';
  const card = darkMode ? '#1c1c28' : '#fff';
  const border = darkMode ? 'rgba(255,255,255,0.13)' : 'rgba(0,0,0,0.13)';
  const divider = darkMode ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.09)';
  const text1 = darkMode ? '#f5f5f5' : '#0a0a0a';
  const text3 = darkMode ? '#a0a0a0' : '#5a5a5a';
  const text4 = darkMode ? '#777' : '#888';
  const backBtnBorder = darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.16)';
  const backBtnColor = darkMode ? '#d0d0d0' : '#3a3a3a';
  const activeLocBg = darkMode ? 'rgba(255,255,255,0.08)' : '#eef0ec';
  const devBadgeBg = darkMode ? '#2a2a3a' : '#1a1a1a';
  const rebuildBtnBg = darkMode ? '#2a2a3a' : '#1a1a1a';

  return (
    <div style={{ width: '100%', height: '100%', background: bg, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: 'var(--top-safe) 20px 16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${border}`, background: headerBg }}>
        <button onClick={onBack} style={{
          background: 'none', border: `1.5px solid ${backBtnBorder}`, borderRadius: 22,
          padding: '8px 14px', color: backBtnColor, cursor: 'pointer', fontFamily: 'inherit',
          fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5, minHeight: 36,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Back
        </button>
        <div>
          <div style={{ fontSize: 19, fontWeight: 700, color: text1, letterSpacing: '-0.02em' }}>Admin</div>
          <div style={{ fontSize: 12, fontWeight: 500, color: text3, marginTop: 2 }}>Mock data controls</div>
        </div>
        <div style={{ marginLeft: 'auto', background: devBadgeBg, borderRadius: 20, padding: '4px 11px' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', letterSpacing: '0.08em' }}>DEV</span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 24px' }}>

        <SectionLabel dark={darkMode}>Weather scenario</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(Object.entries(SCENARIOS) as [ScenarioKey, typeof SCENARIOS[ScenarioKey]][]).map(([key, s]) => {
            const active = scenario === key;
            return (
              <button key={key} onClick={() => { setScenario(key); onRebuild(key); }} style={{
                background: active ? (darkMode ? '#2a2a3a' : '#1a1a1a') : card,
                border: `1.5px solid ${active ? (darkMode ? 'rgba(255,255,255,0.25)' : '#1a1a1a') : border}`,
                borderRadius: 12, padding: '13px 15px',
                display: 'flex', alignItems: 'center', gap: 12,
                cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                transition: 'all 0.18s', minHeight: 56,
              }}>
                <div style={{ width: 11, height: 11, borderRadius: '50%', background: active ? '#fff' : DOT_COLORS[key], flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: active ? '#fff' : text1 }}>{s.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: active ? 'rgba(255,255,255,0.65)' : text3, marginTop: 2 }}>{s.desc}</div>
                </div>
                {active && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.8" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
              </button>
            );
          })}
        </div>

        <SectionLabel dark={darkMode}>Current minute ({nowMin} / 59)</SectionLabel>
        <div style={{ background: card, borderRadius: 12, border: `1.5px solid ${border}`, padding: '18px' }}>
          <input type="range" min="0" max="59" value={nowMin} onChange={e => setNowMin(Number(e.target.value))}
            style={{ width: '100%', accentColor: darkMode ? '#3d9e5f' : '#1a1a1a', cursor: 'pointer', height: 28 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: text4 }}>0 min</span>
            <span style={{ fontSize: 12, color: text1, fontWeight: 700 }}>+{nowMin} min now</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: text4 }}>59 min</span>
          </div>
        </div>

        <SectionLabel dark={darkMode}>Temperature offset ({tempOffset > 0 ? '+' : ''}{tempOffset}°)</SectionLabel>
        <div style={{ background: card, borderRadius: 12, border: `1.5px solid ${border}`, padding: '18px' }}>
          <input type="range" min="-20" max="20" value={tempOffset} onChange={e => setTempOffset(Number(e.target.value))}
            style={{ width: '100%', accentColor: darkMode ? '#3d9e5f' : '#1a1a1a', cursor: 'pointer', height: 28 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: text4 }}>−20°</span>
            <button onClick={() => setTempOffset(0)} style={{ fontSize: 12, fontWeight: 600, color: text3, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: '4px 8px' }}>Reset</button>
            <span style={{ fontSize: 12, fontWeight: 600, color: text4 }}>+20°</span>
          </div>
        </div>

        <SectionLabel dark={darkMode}>Mock location</SectionLabel>
        <div style={{ background: card, borderRadius: 12, border: `1.5px solid ${border}`, overflow: 'hidden' }}>
          {ADMIN_LOCATIONS.map((loc, i) => (
            <div key={loc} onClick={() => setLocation(loc)} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 16px', cursor: 'pointer', minHeight: 50,
              borderBottom: i < ADMIN_LOCATIONS.length - 1 ? `1px solid ${divider}` : 'none',
              background: location === loc ? activeLocBg : 'transparent',
              transition: 'background 0.15s',
            }}>
              <span style={{ fontSize: 15, color: text1, fontWeight: location === loc ? 700 : 500 }}>{loc}</span>
              {location === loc && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3d9e5f" strokeWidth="2.8" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
            </div>
          ))}
        </div>

        <SectionLabel dark={darkMode}>Data status</SectionLabel>
        <div style={{ background: card, borderRadius: 12, border: `1.5px solid ${border}`, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { key: 'Source',    val: 'Pirate Weather API' },
            { key: 'Refreshed', val: 'Just now' },
            { key: 'Provider',  val: 'pirateweather.net' },
            { key: 'Lat/Lng',   val: '37.77°N 122.42°W' },
          ].map(row => (
            <div key={row.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: text3 }}>{row.key}</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: text1, fontFamily: 'monospace' }}>{row.val}</span>
            </div>
          ))}
          <button onClick={() => onRebuild(scenario)} style={{
            marginTop: 8, background: rebuildBtnBg, border: 'none', borderRadius: 10,
            padding: '12px 0', color: '#fff', fontSize: 14, fontWeight: 600,
            fontFamily: 'inherit', cursor: 'pointer', width: '100%', minHeight: 44,
          }}>
            ↻ Rebuild mock data
          </button>
        </div>

      </div>
    </div>
  );
}
