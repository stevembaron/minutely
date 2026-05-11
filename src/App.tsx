import { useState, useEffect, useRef } from 'react';
import { HomeScreen } from './screens/HomeScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { LocationScreen } from './screens/LocationScreen';
import { AdminScreen } from './screens/AdminScreen';
import { buildForecast, fetchLiveData, fetchYesterdayTemp, reverseGeocode } from './weather';
import { evaluateAlerts } from './notifications';
import { WelcomeScreen } from './screens/WelcomeScreen';
import type { Screen, ScenarioKey, Settings, MinuteForecast, CurrentConditions, HourlyForecast, WeatherAlert } from './types';

function load<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function save(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota */ }
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [nowMin, setNowMin] = useState(0);
  const [darkMode, setDarkMode] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
  );
  const [scenario, setScenario] = useState<ScenarioKey>('rain_clearing');
  const [forecast, setForecast] = useState<MinuteForecast[]>(() => buildForecast('rain_clearing'));
  const [location, setLocation] = useState<string>(() => load('soon-location', 'San Francisco, CA'));
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(
    () => load('soon-coords', { lat: 37.7749, lng: -122.4194 })
  );
  const [tempOffset, setTempOffset] = useState(0);
  const [settings, setSettings] = useState<Settings>(() => load('soon-settings', {
    tempUnit: '°F', windUnit: 'mph', alertRain: true, alertClear: true, alertWorsen: false,
  }));
  const [currentConditions, setCurrentConditions] = useState<CurrentConditions | null>(null);
  const [hourlyForecast, setHourlyForecast] = useState<HourlyForecast[]>([]);
  const [sunriseTime, setSunriseTime] = useState<Date | undefined>();
  const [sunsetTime, setSunsetTime] = useState<Date | undefined>();
  const [exiting, setExiting] = useState(false);
  const [, setUsingLive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [yesterdayTemp, setYesterdayTemp] = useState<number | null>(null);
  const [pressureTrend, setPressureTrend] = useState<{ direction: 'rising' | 'falling' | 'steady'; rate: 'fast' | 'normal' } | null>(null);
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [fetchedAt, setFetchedAt] = useState<Date | null>(null);
  const [onboarded, setOnboarded] = useState<boolean>(() => load('soon-onboarded', false));
  const [locationsBackTarget, setLocationsBackTarget] = useState<Screen>('settings');

  // Dark mode listener
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setDarkMode(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Persist settings and location
  useEffect(() => { save('soon-settings', settings); }, [settings]);
  useEffect(() => { save('soon-location', location); }, [location]);
  useEffect(() => { save('soon-coords', locationCoords); }, [locationCoords]);
  useEffect(() => { save('soon-onboarded', onboarded); }, [onboarded]);

  // When the user opts into geolocation, the placeholder name is "My Location".
  // Reverse-geocode it to a real "City, State" string in the background so
  // the hero reads as a real place instead of a generic label.
  useEffect(() => {
    if (location !== 'My Location' || !locationCoords) return;
    let cancelled = false;
    reverseGeocode(locationCoords.lat, locationCoords.lng).then(name => {
      if (cancelled || !name) return;
      setLocation(name);
    });
    return () => { cancelled = true; };
  }, [location, locationCoords]);

  // Advance the "now" indicator every 30s based on real elapsed time
  // since the last fetch. Without this, the timeline visibly stales out
  // — the indicator stays at minute 0 even though real time keeps moving.
  useEffect(() => {
    if (!fetchedAt) return;
    const tick = () => {
      const elapsed = Math.floor((Date.now() - fetchedAt.getTime()) / 60000);
      setNowMin(prev => {
        const target = Math.min(59, Math.max(0, elapsed));
        return target > prev ? target : prev;
      });
    };
    tick();
    const id = setInterval(tick, 30 * 1000);
    return () => clearInterval(id);
  }, [fetchedAt]);

  const selectLocation = (name: string, lat: number, lng: number) => {
    setLocation(name);
    setLocationCoords({ lat, lng });
  };

  // Compute pressure trend by comparing the new reading against samples
  // we've collected over the last few hours in localStorage.
  const updatePressureTrend = (lat: number, lng: number, pressure: number | undefined) => {
    if (pressure == null) { setPressureTrend(null); return; }
    const key = `soon-pressure-${lat.toFixed(2)},${lng.toFixed(2)}`;
    type Sample = { t: number; p: number };
    const now = Date.now();
    let history: Sample[] = [];
    try {
      const raw = localStorage.getItem(key);
      if (raw) history = JSON.parse(raw);
    } catch { /* corrupt */ }
    history.push({ t: now, p: pressure });
    history = history.filter(s => now - s.t < 6 * 60 * 60 * 1000); // last 6h
    try { localStorage.setItem(key, JSON.stringify(history)); } catch { /* quota */ }

    // Need at least one reading from 1.5+ hours ago to call a trend
    const ref = history.find(s => now - s.t >= 90 * 60 * 1000);
    if (!ref) { setPressureTrend(null); return; }
    const diff = pressure - ref.p;
    const absMag = Math.abs(diff);
    if (absMag < 0.5) setPressureTrend({ direction: 'steady', rate: 'normal' });
    else if (diff > 0) setPressureTrend({ direction: 'rising', rate: absMag > 2 ? 'fast' : 'normal' });
    else               setPressureTrend({ direction: 'falling', rate: absMag > 2 ? 'fast' : 'normal' });
  };

  const applyResult = (coords: { lat: number; lng: number }, result: NonNullable<Awaited<ReturnType<typeof fetchLiveData>>>) => {
    const prevCurrent = currentConditions;
    const prevForecast = forecast;
    const now = new Date();
    setForecast(result.forecast);
    setCurrentConditions(result.current);
    setHourlyForecast(result.hourly);
    setSunriseTime(result.sunriseTime);
    setSunsetTime(result.sunsetTime);
    setAlerts(result.alerts);
    setNowMin(0);
    setFetchedAt(now);
    setUsingLive(true);
    setLastUpdated(now);
    setFetchError(false);
    updatePressureTrend(coords.lat, coords.lng, result.current.pressure);
    evaluateAlerts({
      settings,
      prevCurrent,
      prevForecast,
      newCurrent: result.current,
      newForecast: result.forecast,
    });
  };

  const doFetch = (coords: { lat: number; lng: number }) => {
    setRefreshing(true);
    setFetchError(false);
    return fetchLiveData(coords.lat, coords.lng).then(result => {
      if (!result) { setFetchError(true); return; }
      applyResult(coords, result);
    }).catch(() => setFetchError(true))
      .finally(() => setRefreshing(false));
  };

  // Fetch live data whenever coords change
  useEffect(() => {
    if (!locationCoords) { setUsingLive(false); setYesterdayTemp(null); return; }
    let cancelled = false;
    setRefreshing(true);
    setFetchError(false);
    const coords = locationCoords;
    fetchLiveData(coords.lat, coords.lng).then(result => {
      if (cancelled) return;
      if (!result) { setFetchError(true); return; }
      applyResult(coords, result);
    }).catch(() => { if (!cancelled) setFetchError(true); })
      .finally(() => { if (!cancelled) setRefreshing(false); });
    // Yesterday-temp is fetched separately and refreshed at most once per location change
    setYesterdayTemp(null);
    fetchYesterdayTemp(coords.lat, coords.lng).then(t => { if (!cancelled) setYesterdayTemp(t); });
    return () => { cancelled = true; };
  }, [locationCoords]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-refresh every 10 minutes
  useEffect(() => {
    if (!locationCoords) return;
    const id = setInterval(() => doFetch(locationCoords), 10 * 60 * 1000);
    return () => clearInterval(id);
  }, [locationCoords]); // eslint-disable-line react-hooks/exhaustive-deps

  const navigate = (to: Screen) => {
    setExiting(true);
    setTimeout(() => { setScreen(to); setExiting(false); }, 180);
  };

  const rebuildForecast = (key: ScenarioKey) => {
    setForecast(buildForecast(key));
    setNowMin(0);
    setUsingLive(false);
    setLastUpdated(null);
  };

  const adjustedForecast = forecast.map(m => ({ ...m, temp: m.temp + tempOffset }));
  // pointer:coarse = touch device (phone/tablet), catches landscape mode and wide phones too
  const isMobile = typeof window !== 'undefined' && (
    window.innerWidth <= 480 || window.matchMedia('(pointer: coarse)').matches
  );
  const frameRef = useRef<HTMLDivElement>(null);

  const showWelcome = !onboarded;

  const completeOnboarding = () => {
    setOnboarded(true);
  };

  const content = (
    <div style={{
      width: '100%', height: '100%', overflow: 'hidden',
      opacity: exiting ? 0 : 1,
      transform: exiting ? 'translateY(6px)' : 'translateY(0)',
      transition: 'opacity 0.18s ease, transform 0.18s ease',
    }}>
      {showWelcome && (
        <WelcomeScreen
          darkMode={darkMode}
          onGeolocate={(lat, lng) => {
            selectLocation('My Location', lat, lng);
            completeOnboarding();
          }}
          onPickCity={() => {
            completeOnboarding();
            setLocationsBackTarget('home');
            setScreen('locations');
          }}
        />
      )}
      {!showWelcome && screen === 'home' && (
        <HomeScreen
          onSettings={() => navigate('settings')}
          nowMin={nowMin}
          setNowMin={setNowMin}
          forecast={adjustedForecast}
          hourlyForecast={hourlyForecast}
          sunriseTime={sunriseTime}
          sunsetTime={sunsetTime}
          location={location}
          currentConditions={currentConditions}
          settings={settings}
          lastUpdated={lastUpdated}
          refreshing={refreshing}
          fetchError={fetchError}
          onRefresh={() => locationCoords && doFetch(locationCoords)}
          darkMode={darkMode}
          yesterdayTemp={yesterdayTemp}
          pressureTrend={pressureTrend}
          alerts={alerts}
        />
      )}
      {!showWelcome && screen === 'settings' && (
        <SettingsScreen
          onBack={() => navigate('home')}
          settings={settings}
          setSettings={setSettings}
          onAdmin={() => navigate('admin')}
          onLocations={() => navigate('locations')}
          currentLocation={location}
          darkMode={darkMode}
        />
      )}
      {!showWelcome && screen === 'locations' && (
        <LocationScreen
          onBack={() => { const t = locationsBackTarget; setLocationsBackTarget('settings'); navigate(t); }}
          location={location}
          selectLocation={selectLocation}
          darkMode={darkMode}
        />
      )}
      {!showWelcome && screen === 'admin' && (
        <AdminScreen
          onBack={() => navigate('settings')}
          scenario={scenario}
          setScenario={setScenario}
          nowMin={nowMin}
          setNowMin={setNowMin}
          onRebuild={rebuildForecast}
          location={location}
          setLocation={(loc) => { setLocation(loc); setLocationCoords(null); }}
          tempOffset={tempOffset}
          setTempOffset={setTempOffset}
          darkMode={darkMode}
        />
      )}
    </div>
  );

  if (isMobile) {
    // position:fixed is more reliable than 100dvh on iOS Safari (dvh unsupported pre-15.4,
    // and 100vh includes browser chrome which cuts off content at the bottom)
    return (
      <div ref={frameRef} style={{ position: 'fixed', inset: 0, overflow: 'hidden', fontFamily: 'DM Sans, sans-serif' }}>
        {content}
      </div>
    );
  }

  // Desktop: render as a proper web page — page header with brand, centered
  // content card, footer with attribution. The card preserves the mobile
  // layout width (~460px) so existing components don't need redesign.
  const pageBg    = darkMode ? '#0c0d12' : '#eeebe6';
  const cardBg    = darkMode ? '#111318' : '#f7f5f2';
  const cardBdr   = darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
  const cardShdw  = darkMode ? '0 30px 70px rgba(0,0,0,0.45), 0 2px 6px rgba(0,0,0,0.3)'
                             : '0 24px 60px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)';
  const text2     = darkMode ? '#c0c0c0' : '#3a3a3a';
  const text3     = darkMode ? '#8a8a8a' : '#6a6a6a';
  const accent    = '#3d9e5f';

  return (
    <div style={{
      minHeight: '100vh', width: '100%',
      background: pageBg,
      fontFamily: 'DM Sans, -apple-system, system-ui, sans-serif',
      color: text2,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '36px 20px 28px',
    }}>
      {/* Page header — brand wordmark + tagline */}
      <header style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginBottom: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: accent, opacity: 0.35 }} />
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: accent, opacity: 0.65 }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: accent }} />
          </div>
          <span style={{ fontSize: 22, fontWeight: 700, color: accent, letterSpacing: '-0.025em', marginLeft: 2 }}>soon</span>
        </div>
        <div style={{ fontSize: 13, fontWeight: 500, color: text3, letterSpacing: '-0.005em' }}>
          Weather for the next hour.
        </div>
      </header>

      {/* App card — preserves the mobile content size and internal scroll */}
      <main style={{
        width: '100%', maxWidth: 460,
        height: 'min(840px, calc(100vh - 200px))', minHeight: 560,
        borderRadius: 22, overflow: 'hidden',
        background: cardBg,
        boxShadow: cardShdw,
        border: `1px solid ${cardBdr}`,
        position: 'relative',
      }}>
        {content}
      </main>

      {/* Footer — attribution + install hint */}
      <footer style={{
        marginTop: 18, textAlign: 'center',
        fontSize: 11, fontWeight: 500, color: text3, lineHeight: 1.6,
        maxWidth: 460,
      }}>
        Powered by Pirate Weather · Open-source forecasting · No tracking.
      </footer>
    </div>
  );
}
