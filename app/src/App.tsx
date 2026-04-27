import { useState, useEffect } from 'react';
import { IOSDevice } from './components/IOSDevice';
import { HomeScreen } from './screens/HomeScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { LocationScreen } from './screens/LocationScreen';
import { AdminScreen } from './screens/AdminScreen';
import { buildForecast, fetchMinuteForecast, DEFAULT_LOCATIONS } from './weather';
import type { Screen, ScenarioKey, Settings, MinuteForecast } from './types';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [nowMin, setNowMin] = useState(0);
  const [scenario, setScenario] = useState<ScenarioKey>('rain_clearing');
  const [forecast, setForecast] = useState<MinuteForecast[]>(() => buildForecast('rain_clearing'));
  const [location, setLocation] = useState('San Francisco, CA');
  const [tempOffset, setTempOffset] = useState(0);
  const [settings, setSettings] = useState<Settings>({ tempUnit: '°F', windUnit: 'mph', alertRain: true, alertClear: true, alertWorsen: false });
  const [exiting, setExiting] = useState(false);
  const [usingLive, setUsingLive] = useState(false);

  // Try to fetch live data for the selected location
  useEffect(() => {
    const loc = DEFAULT_LOCATIONS.find(l => `${l.city}, ${l.state}` === location);
    if (!loc) { setUsingLive(false); return; }

    let cancelled = false;
    fetchMinuteForecast(loc.lat, loc.lng).then(data => {
      if (cancelled || !data) return;
      setForecast(data);
      setNowMin(0);
      setUsingLive(true);
    });
    return () => { cancelled = true; };
  }, [location]);

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

  return (
    <IOSDevice dark={false}>
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
            setLocation={(loc) => { setLocation(loc); }}
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
            setLocation={setLocation}
            tempOffset={tempOffset}
            setTempOffset={setTempOffset}
          />
        )}
        {usingLive && (
          <div style={{
            position: 'fixed', bottom: 50, left: '50%', transform: 'translateX(-50%)',
            background: '#3d9e5f', color: '#fff', fontSize: 10, fontWeight: 600,
            padding: '3px 10px', borderRadius: 20, letterSpacing: '0.06em',
            pointerEvents: 'none', zIndex: 999,
          }}>LIVE</div>
        )}
      </div>
    </IOSDevice>
  );
}
