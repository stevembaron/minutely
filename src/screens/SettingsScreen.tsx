import type { Settings } from '../types';

interface Props {
  onBack: () => void;
  settings: Settings;
  setSettings: (fn: (s: Settings) => Settings) => void;
  onAdmin: () => void;
  onLocations: () => void;
  currentLocation: string;
  darkMode?: boolean;
}

function SectionLabel({ children, dark }: { children: React.ReactNode; dark: boolean }) {
  return (
    <div style={{ fontSize: 12, color: dark ? '#a0a0a0' : '#5a5a5a', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, margin: '22px 0 10px' }}>
      {children}
    </div>
  );
}

function Row({ label, sub, children, last, dark }: { label: string; sub?: string; children?: React.ReactNode; last?: boolean; dark: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 16px', minHeight: 52,
      borderBottom: last ? 'none' : `1px solid ${dark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.09)'}`,
    }}>
      <div>
        <div style={{ fontSize: 15, fontWeight: 600, color: dark ? '#f5f5f5' : '#0a0a0a' }}>{label}</div>
        {sub && <div style={{ fontSize: 13, fontWeight: 500, color: dark ? '#a0a0a0' : '#5a5a5a', marginTop: 3 }}>{sub}</div>}
      </div>
      {children}
    </div>
  );
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <div onClick={onToggle} style={{
      width: 50, height: 30, borderRadius: 15, cursor: 'pointer',
      background: on ? '#3d9e5f' : '#c8c8c8',
      position: 'relative', transition: 'background 0.22s', flexShrink: 0,
    }}>
      <div style={{
        width: 26, height: 26, borderRadius: '50%', background: '#fff',
        position: 'absolute', top: 2, left: on ? 22 : 2,
        transition: 'left 0.22s', boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
      }} />
    </div>
  );
}

function SegPicker({ options, value, onChange, dark }: { options: string[]; value: string; onChange: (v: string) => void; dark: boolean }) {
  return (
    <div style={{ display: 'flex', background: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.07)', borderRadius: 9, padding: 3, gap: 2 }}>
      {options.map(opt => (
        <button key={opt} onClick={() => onChange(opt)} style={{
          padding: '6px 14px', borderRadius: 7, border: 'none', cursor: 'pointer',
          background: value === opt ? (dark ? 'rgba(255,255,255,0.18)' : '#fff') : 'transparent',
          color: value === opt ? (dark ? '#f5f5f5' : '#0a0a0a') : (dark ? '#888' : '#666'),
          fontSize: 14, fontWeight: value === opt ? 700 : 500,
          fontFamily: 'inherit',
          boxShadow: value === opt ? (dark ? '0 1px 3px rgba(0,0,0,0.4)' : '0 1px 3px rgba(0,0,0,0.15)') : 'none',
          transition: 'all 0.18s',
        }}>{opt}</button>
      ))}
    </div>
  );
}

export function SettingsScreen({ onBack, settings, setSettings, onAdmin, onLocations, currentLocation, darkMode = false }: Props) {
  const set = (k: keyof Settings, v: Settings[keyof Settings]) => setSettings(s => ({ ...s, [k]: v }));
  const toggle = (k: keyof Settings) => setSettings(s => ({ ...s, [k]: !s[k] }));

  const bg = darkMode ? '#111318' : '#f7f5f2';
  const card = darkMode ? '#1c1c28' : '#fff';
  const border = darkMode ? 'rgba(255,255,255,0.13)' : 'rgba(0,0,0,0.13)';
  const text1 = darkMode ? '#f5f5f5' : '#0a0a0a';
  const text3 = darkMode ? '#a0a0a0' : '#5a5a5a';
  const chevron = darkMode ? '#666' : '#999';
  const backBtnBorder = darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.16)';
  const backBtnColor = darkMode ? '#d0d0d0' : '#3a3a3a';

  return (
    <div style={{ width: '100%', height: '100%', background: bg, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: 'var(--top-safe) 20px 16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${border}` }}>
        <button onClick={onBack} style={{
          background: 'none', border: `1.5px solid ${backBtnBorder}`, borderRadius: 22,
          padding: '8px 14px', color: backBtnColor, cursor: 'pointer', fontFamily: 'inherit',
          fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5, minHeight: 36,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Back
        </button>
        <span style={{ fontSize: 19, fontWeight: 700, color: text1, letterSpacing: '-0.02em' }}>Settings</span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 24px' }}>

        <SectionLabel dark={darkMode}>Location</SectionLabel>
        <div onClick={onLocations} style={{ background: card, borderRadius: 12, border: `1.5px solid ${border}`, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 11, cursor: 'pointer', minHeight: 52 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3d9e5f" strokeWidth="2.2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <span style={{ fontSize: 15, fontWeight: 600, color: text1 }}>{currentLocation}</span>
          <svg style={{ marginLeft: 'auto' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={chevron} strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
        </div>

        <SectionLabel dark={darkMode}>Units</SectionLabel>
        <div style={{ background: card, borderRadius: 12, border: `1.5px solid ${border}` }}>
          <Row label="Temperature" dark={darkMode}>
            <SegPicker dark={darkMode} options={['°F', '°C']} value={settings.tempUnit} onChange={v => set('tempUnit', v as Settings['tempUnit'])} />
          </Row>
          <Row label="Wind Speed" last dark={darkMode}>
            <SegPicker dark={darkMode} options={['mph', 'km/h']} value={settings.windUnit} onChange={v => set('windUnit', v as Settings['windUnit'])} />
          </Row>
        </div>

        <SectionLabel dark={darkMode}>Alerts</SectionLabel>
        <div style={{ background: card, borderRadius: 12, border: `1.5px solid ${border}` }}>
          <Row label="Rain starting soon" sub="5 minutes before precipitation" dark={darkMode}>
            <Toggle on={settings.alertRain} onToggle={() => toggle('alertRain')} />
          </Row>
          <Row label="Clear break coming" sub="Gaps in rain or clouds" dark={darkMode}>
            <Toggle on={settings.alertClear} onToggle={() => toggle('alertClear')} />
          </Row>
          <Row label="Conditions worsening" sub="Rapid weather changes" last dark={darkMode}>
            <Toggle on={settings.alertWorsen} onToggle={() => toggle('alertWorsen')} />
          </Row>
        </div>

        <SectionLabel dark={darkMode}>Color key</SectionLabel>
        <div style={{ background: card, borderRadius: 12, border: `1.5px solid ${border}`, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { color: '#3d9e5f', label: 'Clear',      desc: 'Good to go' },
            { color: '#8db840', label: 'Clearing',   desc: 'Getting better' },
            { color: '#d4a017', label: 'Drizzle',    desc: 'Watch out' },
            { color: '#c94f2a', label: 'Rain',       desc: 'Bring an umbrella' },
            { color: '#b03020', label: 'Heavy rain', desc: 'Stay inside if you can' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: item.color, flexShrink: 0 }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: text1, minWidth: 92 }}>{item.label}</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: text3 }}>{item.desc}</span>
            </div>
          ))}
        </div>

        <SectionLabel dark={darkMode}>About</SectionLabel>
        <div style={{ background: card, borderRadius: 12, border: `1.5px solid ${border}`, padding: '16px 18px' }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: darkMode ? '#b0b0b0' : '#444', lineHeight: 1.6 }}>
            <span style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 500, color: text1, fontSize: 17 }}>Soon</span>{' '}
            focuses on what's happening in the next hour — not the five-day forecast.
          </div>
        </div>

        <SectionLabel dark={darkMode}>Developer</SectionLabel>
        <div style={{ background: card, borderRadius: 12, border: `1.5px solid ${border}`, overflow: 'hidden' }}>
          <div onClick={onAdmin} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', cursor: 'pointer', minHeight: 56 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: darkMode ? '#2a2a3a' : '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 14, color: '#fff', fontWeight: 700 }}>⚙</span>
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: text1 }}>Admin Panel</div>
                <div style={{ fontSize: 13, fontWeight: 500, color: text3, marginTop: 2 }}>Mock data, scenarios, overrides</div>
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={chevron} strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
          </div>
        </div>
      </div>
    </div>
  );
}
