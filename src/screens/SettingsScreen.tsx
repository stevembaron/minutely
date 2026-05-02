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
    <div style={{ fontSize: 11, color: dark ? '#777' : '#aaa', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, margin: '20px 0 8px' }}>
      {children}
    </div>
  );
}

function Row({ label, sub, children, last, dark }: { label: string; sub?: string; children?: React.ReactNode; last?: boolean; dark: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 16px',
      borderBottom: last ? 'none' : `1px solid ${dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'}`,
    }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 500, color: dark ? '#f0f0f0' : '#1a1a1a' }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: dark ? '#777' : '#aaa', marginTop: 2 }}>{sub}</div>}
      </div>
      {children}
    </div>
  );
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <div onClick={onToggle} style={{
      width: 42, height: 24, borderRadius: 12, cursor: 'pointer',
      background: on ? '#3d9e5f' : '#d0d0d0',
      position: 'relative', transition: 'background 0.22s', flexShrink: 0,
    }}>
      <div style={{
        width: 20, height: 20, borderRadius: '50%', background: '#fff',
        position: 'absolute', top: 2, left: on ? 20 : 2,
        transition: 'left 0.22s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </div>
  );
}

function SegPicker({ options, value, onChange, dark }: { options: string[]; value: string; onChange: (v: string) => void; dark: boolean }) {
  return (
    <div style={{ display: 'flex', background: dark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.06)', borderRadius: 8, padding: 2, gap: 2 }}>
      {options.map(opt => (
        <button key={opt} onClick={() => onChange(opt)} style={{
          padding: '4px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
          background: value === opt ? (dark ? 'rgba(255,255,255,0.15)' : '#fff') : 'transparent',
          color: value === opt ? (dark ? '#f0f0f0' : '#1a1a1a') : (dark ? '#666' : '#888'),
          fontSize: 13, fontWeight: value === opt ? 600 : 400,
          fontFamily: 'inherit',
          boxShadow: value === opt ? (dark ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.12)') : 'none',
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
  const card = darkMode ? '#1a1a24' : '#fff';
  const border = darkMode ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.08)';
  const text1 = darkMode ? '#f0f0f0' : '#1a1a1a';
  const text3 = darkMode ? '#777' : '#aaa';
  const chevron = darkMode ? '#444' : '#ccc';
  const backBtnBorder = darkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)';
  const backBtnColor = darkMode ? '#aaa' : '#555';

  return (
    <div style={{ width: '100%', height: '100%', background: bg, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: 'var(--top-safe) 20px 14px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${border}` }}>
        <button onClick={onBack} style={{
          background: 'none', border: `1.5px solid ${backBtnBorder}`, borderRadius: 20,
          padding: '5px 12px', color: backBtnColor, cursor: 'pointer', fontFamily: 'inherit',
          fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Back
        </button>
        <span style={{ fontSize: 17, fontWeight: 600, color: text1, letterSpacing: '-0.02em' }}>Settings</span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 24px' }}>

        <SectionLabel dark={darkMode}>Location</SectionLabel>
        <div onClick={onLocations} style={{ background: card, borderRadius: 12, border: `1px solid ${border}`, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3d9e5f" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <span style={{ fontSize: 14, fontWeight: 500, color: text1 }}>{currentLocation}</span>
          <svg style={{ marginLeft: 'auto' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={chevron} strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
        </div>

        <SectionLabel dark={darkMode}>Units</SectionLabel>
        <div style={{ background: card, borderRadius: 12, border: `1px solid ${border}` }}>
          <Row label="Temperature" dark={darkMode}>
            <SegPicker dark={darkMode} options={['°F', '°C']} value={settings.tempUnit} onChange={v => set('tempUnit', v as Settings['tempUnit'])} />
          </Row>
          <Row label="Wind Speed" last dark={darkMode}>
            <SegPicker dark={darkMode} options={['mph', 'km/h']} value={settings.windUnit} onChange={v => set('windUnit', v as Settings['windUnit'])} />
          </Row>
        </div>

        <SectionLabel dark={darkMode}>Alerts</SectionLabel>
        <div style={{ background: card, borderRadius: 12, border: `1px solid ${border}` }}>
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
        <div style={{ background: card, borderRadius: 12, border: `1px solid ${border}`, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { color: '#3d9e5f', label: 'Clear',      desc: 'Good to go' },
            { color: '#8db840', label: 'Clearing',   desc: 'Getting better' },
            { color: '#d4a017', label: 'Drizzle',    desc: 'Watch out' },
            { color: '#c94f2a', label: 'Rain',       desc: 'Bring an umbrella' },
            { color: '#b03020', label: 'Heavy rain', desc: 'Stay inside if you can' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: item.color, flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 500, color: text1, minWidth: 80 }}>{item.label}</span>
              <span style={{ fontSize: 12, color: text3 }}>{item.desc}</span>
            </div>
          ))}
        </div>

        <SectionLabel dark={darkMode}>About</SectionLabel>
        <div style={{ background: card, borderRadius: 12, border: `1px solid ${border}`, padding: '14px 16px' }}>
          <div style={{ fontSize: 13, color: darkMode ? '#888' : '#888', lineHeight: 1.6 }}>
            <span style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 500, color: text1, fontSize: 15 }}>Soon</span>{' '}
            focuses on what's happening in the next hour — not the five-day forecast.
          </div>
        </div>

        <SectionLabel dark={darkMode}>Developer</SectionLabel>
        <div style={{ background: card, borderRadius: 12, border: `1px solid ${border}`, overflow: 'hidden' }}>
          <div onClick={onAdmin} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: darkMode ? '#2a2a3a' : '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 12, color: '#fff', fontWeight: 700 }}>⚙</span>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: text1 }}>Admin Panel</div>
                <div style={{ fontSize: 12, color: text3, marginTop: 1 }}>Mock data, scenarios, overrides</div>
              </div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={chevron} strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
          </div>
        </div>
      </div>
    </div>
  );
}
