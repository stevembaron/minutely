import type { Settings } from '../types';

interface Props {
  onBack: () => void;
  settings: Settings;
  setSettings: (fn: (s: Settings) => Settings) => void;
  onAdmin: () => void;
  onLocations: () => void;
  currentLocation: string;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, color: '#aaa', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, margin: '20px 0 8px' }}>
      {children}
    </div>
  );
}

function Row({ label, sub, children, last }: { label: string; sub?: string; children?: React.ReactNode; last?: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 16px',
      borderBottom: last ? 'none' : '1px solid rgba(0,0,0,0.06)',
    }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 500, color: '#1a1a1a' }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: '#aaa', marginTop: 2 }}>{sub}</div>}
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

function SegPicker({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', background: 'rgba(0,0,0,0.06)', borderRadius: 8, padding: 2, gap: 2 }}>
      {options.map(opt => (
        <button key={opt} onClick={() => onChange(opt)} style={{
          padding: '4px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
          background: value === opt ? '#fff' : 'transparent',
          color: value === opt ? '#1a1a1a' : '#888',
          fontSize: 13, fontWeight: value === opt ? 600 : 400,
          fontFamily: 'inherit',
          boxShadow: value === opt ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
          transition: 'all 0.18s',
        }}>{opt}</button>
      ))}
    </div>
  );
}

export function SettingsScreen({ onBack, settings, setSettings, onAdmin, onLocations, currentLocation }: Props) {
  const set = (k: keyof Settings, v: Settings[keyof Settings]) => setSettings(s => ({ ...s, [k]: v }));
  const toggle = (k: keyof Settings) => setSettings(s => ({ ...s, [k]: !s[k] }));

  return (
    <div style={{ width: '100%', height: '100%', background: '#f7f5f2', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: 'max(env(safe-area-inset-top), 20px) 20px 14px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
        <button onClick={onBack} style={{
          background: 'none', border: '1.5px solid rgba(0,0,0,0.12)', borderRadius: 20,
          padding: '5px 12px', color: '#555', cursor: 'pointer', fontFamily: 'inherit',
          fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Back
        </button>
        <span style={{ fontSize: 17, fontWeight: 600, color: '#1a1a1a', letterSpacing: '-0.02em' }}>Settings</span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 24px' }}>

        <SectionLabel>Location</SectionLabel>
        <div onClick={onLocations} style={{ background: '#fff', borderRadius: 12, border: '1px solid rgba(0,0,0,0.08)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3d9e5f" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <span style={{ fontSize: 14, fontWeight: 500, color: '#1a1a1a' }}>{currentLocation}</span>
          <svg style={{ marginLeft: 'auto' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
        </div>

        <SectionLabel>Units</SectionLabel>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid rgba(0,0,0,0.08)' }}>
          <Row label="Temperature">
            <SegPicker options={['°F', '°C']} value={settings.tempUnit} onChange={v => set('tempUnit', v as Settings['tempUnit'])} />
          </Row>
          <Row label="Wind Speed" last>
            <SegPicker options={['mph', 'km/h']} value={settings.windUnit} onChange={v => set('windUnit', v as Settings['windUnit'])} />
          </Row>
        </div>

        <SectionLabel>Alerts</SectionLabel>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid rgba(0,0,0,0.08)' }}>
          <Row label="Rain starting soon" sub="5 minutes before precipitation">
            <Toggle on={settings.alertRain} onToggle={() => toggle('alertRain')} />
          </Row>
          <Row label="Clear break coming" sub="Gaps in rain or clouds">
            <Toggle on={settings.alertClear} onToggle={() => toggle('alertClear')} />
          </Row>
          <Row label="Conditions worsening" sub="Rapid weather changes" last>
            <Toggle on={settings.alertWorsen} onToggle={() => toggle('alertWorsen')} />
          </Row>
        </div>

        <SectionLabel>Color key</SectionLabel>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid rgba(0,0,0,0.08)', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { color: '#3d9e5f', label: 'Clear',      desc: 'Good to go' },
            { color: '#8db840', label: 'Clearing',   desc: 'Getting better' },
            { color: '#d4a017', label: 'Drizzle',    desc: 'Watch out' },
            { color: '#c94f2a', label: 'Rain',       desc: 'Bring an umbrella' },
            { color: '#b03020', label: 'Heavy rain', desc: 'Stay inside if you can' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: item.color, flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a', minWidth: 80 }}>{item.label}</span>
              <span style={{ fontSize: 12, color: '#aaa' }}>{item.desc}</span>
            </div>
          ))}
        </div>

        <SectionLabel>About</SectionLabel>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid rgba(0,0,0,0.08)', padding: '14px 16px' }}>
          <div style={{ fontSize: 13, color: '#888', lineHeight: 1.6 }}>
            <span style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 500, color: '#1a1a1a', fontSize: 15 }}>Soon</span>{' '}
            focuses on what's happening in the next hour — not the five-day forecast.
          </div>
        </div>

        <SectionLabel>Developer</SectionLabel>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          <div onClick={onAdmin} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 12, color: '#fff', fontWeight: 700 }}>⚙</span>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#1a1a1a' }}>Admin Panel</div>
                <div style={{ fontSize: 12, color: '#aaa', marginTop: 1 }}>Mock data, scenarios, overrides</div>
              </div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
          </div>
        </div>
      </div>
    </div>
  );
}
