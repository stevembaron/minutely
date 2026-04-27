export type Condition = 'clear' | 'clearing' | 'drizzle' | 'rain';

export interface MinuteForecast {
  minute: number;
  precip: number; // 0–1 intensity
  condition: Condition;
  temp: number;   // °F
}

export interface CurrentConditions {
  windSpeed: number;   // mph
  humidity: number;    // 0–100
  uvIndex: number;
  visibility: number;  // miles
  feelsLike: number;   // °F
}

export interface LocationInfo {
  city: string;
  state: string;
  lat: number;
  lng: number;
  temp?: number;
  condition?: Condition;
}

export interface Settings {
  tempUnit: '°F' | '°C';
  windUnit: 'mph' | 'km/h';
  alertRain: boolean;
  alertClear: boolean;
  alertWorsen: boolean;
}

export type Screen = 'home' | 'settings' | 'locations' | 'admin';

export type ScenarioKey = 'rain_clearing' | 'all_clear' | 'storm_incoming' | 'steady_rain' | 'drizzle';
