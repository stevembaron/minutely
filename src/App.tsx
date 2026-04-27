import { useState, useEffect, useRef } from 'react';
import { IOSDevice } from './components/IOSDevice';
import { HomeScreen } from './screens/HomeScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { LocationScreen } from './screens/LocationScreen';
import { AdminScreen } from './screens/AdminScreen';
import { buildForecast, fetchLiveData } from './weather';
import type { Screen, ScenarioKey, Settings, MinuteForecast, CurrentConditions } from './types';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [nowMin, setNowMin] = useState(0);
  const [scenario, setScenario] = useState<ScenarioKey>('rain_clearing');
  const [forecast, setForecast] = useState<MinuteForecast[]>(() => buildForecast('rain_clearing'));
  const [location, setLocation] = useState('San Francisco, CA');
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(
    { lat: 37.7749, lng: -122.4194 }
  );
  const [tempOffset, setTempOffset] = useState(0);
  const [settings, setSettings] = useState<Settings>({ tempUnit: '°F', windUnit: 'mph', alertRain: true, alertClear: true, alertWorsen: false });
  const [currentConditions, setCurrentConditions] = useState<CurrentConditions | null>(null);
  const [exiting, setExiting] = useState(false);
  const [usingLive, setUsingLive] = useState(false);

  const selectLocation = (name: string, lat: number, lng: number) => {
    setLocation(name);
    setLocationCoords({ lat, lng });
  };

  // Fetch live data whenever coords change
  useEffect(() => {
    if (!locationCoords) { setUsingLive(false); return; }
    let cancelled = false;
    fetchLiveData(locationCoords.lat, locationCoords.lng).then(result => {
      if (cancelled || !result) return;
      setForecast(result.forecast);
      setCurrentConditions(result.current);
      setNowMin(0);
      setUsingLive(true);
    });
    return () => { cancelled = true; };
  }, [locationCoords]);

  const navigate = (to: Screen) => {
    setExiting(true);
    setTimeout(() => { setScreen(to); setExiting(false); }, 180);
  };

  const rebuildForecast = (key: ScenarioKey) => {
    setForecast(buildForecast(key));
    setNowMin(0);
    setUsingLive(false);
  };

  const adjustedForecast = forecast.map(m => ({ ...m, temp: m.temp + tempOffset }));

  // On small screens show full-screen; on large screens show inside iOS frame
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 480;
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
            location={location}
            currentConditions={currentConditions}
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
        {usingLive && (
          <div style={{
            position: 'absolute', bottom: 50, left: '50%', transform: 'translateX(-50%)',
            background: '#3d9e5f', color: '#fff', fontSize: 10, fontWeight: 600,
            padding: '3px 10px', borderRadius: 20, letterSpacing: '0.06em',
            pointerEvents: 'none', zIndex: 999,
          }}>LIVE</div>
        )}
      </div>
  );

  if (isMobile) {
    return (
      <div ref={frameRef} style={{ width: '100vw', height: '100dvh', overflow: 'hidden', fontFamily: 'DM Sans, sans-serif' }}>
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
