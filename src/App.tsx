import { useState, useEffect, useRef } from 'react';
import { IOSDevice } from './components/IOSDevice';
import { HomeScreen } from './screens/HomeScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { LocationScreen } from './screens/LocationScreen';
import { AdminScreen } from './screens/AdminScreen';
import { buildForecast, fetchLiveData, fetchYesterdayTemp } from './weather';
import { evaluateAlerts } from './notifications';
import type { Screen, ScenarioKey, Settings, MinuteForecast, CurrentConditions, HourlyForecast } from './types';

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
    setForecast(result.forecast);
    setCurrentConditions(result.current);
    setHourlyForecast(result.hourly);
    setSunriseTime(result.sunriseTime);
    setSunsetTime(result.sunsetTime);
    setNowMin(0);
    setUsingLive(true);
    setLastUpdated(new Date());
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

  const content = (
    <div style={{
      width: '100%', height: '100%', overflow: 'hidden',
      opacity: exiting ? 0 : 1,
      transform: exiting ? 'translateY(6px)' : 'translateY(0)',
      transition: 'opacity 0.18s ease, transform 0.18s ease',
    }}>
      {screen === 'home' && (
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
        />
      )}
      {screen === 'settings' && (
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
      {screen === 'locations' && (
        <LocationScreen
          onBack={() => navigate('settings')}
          location={location}
          selectLocation={selectLocation}
          darkMode={darkMode}
        />
      )}
      {screen === 'admin' && (
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

  return (
    <IOSDevice dark={darkMode}>
      {content}
    </IOSDevice>
  );
}
