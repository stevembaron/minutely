import { useState } from 'react';

interface Props {
  onGeolocate: (lat: number, lng: number) => void;
  onPickCity: () => void;
  darkMode?: boolean;
}

function FeatureChip({ icon, label, darkMode }: { icon: React.ReactNode; label: string; darkMode: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 7,
      color: darkMode ? '#a8d4b6' : '#3d9e5f',
      fontSize: 13, fontWeight: 600,
    }}>
      {icon}
      <span style={{ color: darkMode ? '#c0c0c0' : '#3a3a3a' }}>{label}</span>
    </div>
  );
}

export function WelcomeScreen({ onGeolocate, onPickCity, darkMode = false }: Props) {
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bg     = darkMode ? '#111318' : '#f7f5f2';
  const card   = darkMode ? '#1c1c28' : '#fff';
  const border = darkMode ? 'rgba(255,255,255,0.13)' : 'rgba(0,0,0,0.13)';
  const text1  = darkMode ? '#f5f5f5' : '#0a0a0a';
  const text2  = darkMode ? '#c0c0c0' : '#3a3a3a';
  const text3  = darkMode ? '#a0a0a0' : '#5a5a5a';

  const requestLocation = () => {
    setError(null);
    if (!navigator.geolocation) { setError('Geolocation isn\'t available in this browser.'); return; }
    setRequesting(true);
    navigator.geolocation.getCurrentPosition(
      pos => { setRequesting(false); onGeolocate(pos.coords.latitude, pos.coords.longitude); },
      err => {
        setRequesting(false);
        if (err.code === 1) setError('Location access denied. You can pick a city instead.');
        else if (err.code === 2) setError('Location unavailable. Try picking a city.');
        else setError('Couldn\'t get your location. Try picking a city.');
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  };

  return (
    <div style={{
      width: '100%', height: '100%', background: bg,
      display: 'flex', flexDirection: 'column',
      padding: 'var(--top-safe) 28px var(--bottom-safe)',
      overflow: 'hidden',
    }}>
      {/* Hero / brand */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#3d9e5f', opacity: 0.35 }} />
            <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#3d9e5f', opacity: 0.65 }} />
            <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#3d9e5f' }} />
          </div>
          <span style={{ fontSize: 28, fontWeight: 700, color: '#3d9e5f', letterSpacing: '-0.03em', lineHeight: 1, marginLeft: 4 }}>soon</span>
        </div>

        <h1 style={{
          fontFamily: 'inherit',
          fontSize: 34, fontWeight: 600, color: text1,
          letterSpacing: '-0.025em', lineHeight: 1.1, margin: 0,
        }}>
          Weather for the<br/>next hour.
        </h1>

        <p style={{ fontSize: 16, fontWeight: 500, color: text2, lineHeight: 1.5, maxWidth: 320, margin: '4px 0 0' }}>
          Minute-by-minute precipitation, leave-at planner, and severe-weather alerts — focused on right now, not five days out.
        </p>

        <div style={{ display: 'flex', gap: 18, marginTop: 14, justifyContent: 'center', flexWrap: 'wrap', maxWidth: 360 }}>
          <FeatureChip darkMode={darkMode} icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/>
            </svg>
          } label="Minute-level" />
          <FeatureChip darkMode={darkMode} icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          } label="Severe alerts" />
          <FeatureChip darkMode={darkMode} icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v6M12 22v-2M5 12H2M22 12h-3M19 5l-2.1 2.1M5 19l2.1-2.1M5 5l2.1 2.1M19 19l-2.1-2.1"/>
            </svg>
          } label="No clutter" />
        </div>
      </div>

      {/* Bottom CTA stack */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 12 }}>
        {error && (
          <div style={{
            background: darkMode ? 'rgba(192,57,43,0.18)' : '#fdf0ef',
            border: '1.5px solid #f5c6c3',
            borderRadius: 12, padding: '11px 14px',
            fontSize: 13, fontWeight: 500, color: '#c0392b', textAlign: 'center',
          }}>{error}</div>
        )}

        <button onClick={requestLocation} disabled={requesting} style={{
          background: '#3d9e5f', border: 'none', borderRadius: 14,
          padding: '16px 18px', minHeight: 54, color: '#fff',
          fontSize: 16, fontWeight: 700, fontFamily: 'inherit', cursor: requesting ? 'default' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
          opacity: requesting ? 0.7 : 1, transition: 'opacity 0.18s',
          boxShadow: '0 2px 8px rgba(61,158,95,0.28)',
        }}>
          {requesting ? (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 1s linear infinite' }}>
                <polyline points="23 4 23 10 17 10"/>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
              </svg>
              Getting your location…
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
                <circle cx="12" cy="12" r="9" strokeDasharray="2 3"/>
              </svg>
              Use my location
            </>
          )}
        </button>

        <button onClick={onPickCity} style={{
          background: 'transparent', border: `1.5px solid ${border}`, borderRadius: 14,
          padding: '14px 18px', minHeight: 50, color: text1,
          fontSize: 15, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
        }}>
          Pick a city instead
        </button>

        <p style={{ fontSize: 12, fontWeight: 500, color: text3, textAlign: 'center', marginTop: 6, lineHeight: 1.5 }}>
          We only use your location to fetch the forecast — it never leaves your device.<br/>
          Powered by Pirate Weather + NWS / Met alerts.
        </p>

        <div style={{ background: card, borderRadius: 12, border: `1.5px solid ${border}`, padding: '10px 14px', marginTop: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: text2, marginBottom: 2 }}>Tip: install to your home screen</div>
          <div style={{ fontSize: 11, fontWeight: 500, color: text3, lineHeight: 1.5 }}>
            iOS: tap Share → "Add to Home Screen". Android: tap menu → "Install app".
          </div>
        </div>
      </div>
    </div>
  );
}
