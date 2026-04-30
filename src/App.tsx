import { useState, useEffect, useRef } from 'react';
import { IOSDevice } from './components/IOSDevice';
import { HomeScreen } from './screens/HomeScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { LocationScreen } from './screens/LocationScreen';
import { AdminScreen } from './screens/AdminScreen';
import { buildForecast, fetchLiveData } from './weather';
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
  const [exiting, setExiting] = useState(false);
  const [, setUsingLive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  // Persist settings and location
  useEffect(() => { save('soon-settings', settings); }, [settings]);
  useEffect(() => { save('soon-location', location); }, [location]);
  useEffect(() => { save('soon-coords', locationCoords); }, [locationCoords]);

  const selectLocation = (name: string, lat: number, lng: number) => {
    setLocation(name);
    setLocationCoords({ lat, lng });
  };

  const doFetch = (coords: { lat: number; lng: number }) => {
    setRefreshing(true);
    setFetchError(false);
    return fetchLiveData(coords.lat, coords.lng).then(result => {
      if (!result) { setFetchError(true); return; }
      setForecast(result.forecast);
      setCurrentConditions(result.current);
      setHourlyForecast(result.hourly);
      setNowMin(0);
      setUsingLive(true);
      setLastUpdated(new Date());
      setFetchError(false);
    }).catch(() => setFetchError(true))
      .finally(() => setRefreshing(false));
  };

  // Fetch live data whenever coords change
  useEffect(() => {
    if (!locationCoords) { setUsingLive(false); return; }
    let cancelled = false;
    setRefreshing(true);
    setFetchError(false);
    fetchLiveData(locationCoords.lat, locationCoords.lng).then(result => {
      if (cancelled) return;
      if (!result) { setFetchError(true); return; }
      setForecast(result.forecast);
      setCurrentConditions(result.current);
      setHourlyForecast(result.hourly);
      setNowMin(0);
      setUsingLive(true);
      setLastUpdated(new Date());
      setFetchError(false);
    }).catch(() => { if (!cancelled) setFetchError(true); })
      .finally(() => { if (!cancelled) setRefreshing(false); });
    return () => { cancelled = true; };
  }, [locationCoords]);

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
          location={location}
          currentConditions={currentConditions}
          settings={settings}
          lastUpdated={lastUpdated}
          refreshing={refreshing}
          fetchError={fetchError}
          onRefresh={() => locationCoords && doFetch(locationCoords)}
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
        />
      )}
      {screen === 'locations' && (
        <LocationScreen
          onBack={() => navigate('settings')}
          location={location}
          selectLocation={selectLocation}
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
    <IOSDevice dark={false}>
      {content}
    </IOSDevice>
  );
}
