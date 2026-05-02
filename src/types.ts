export type Condition = 'clear' | 'clearing' | 'drizzle' | 'rain' | 'flurries' | 'snow' | 'sleet';

export interface MinuteForecast {
  minute: number;
  precip: number; // 0–1 intensity
  condition: Condition;
  temp: number;   // °F
}

export interface CurrentConditions {
  windSpeed: number;    // mph
  windBearing?: number; // degrees 0–360
  humidity: number;     // 0–100
  uvIndex: number;
  visibility: number;   // miles
  feelsLike: number;    // °F
  highTemp?: number;    // °F, today's high from daily
  lowTemp?: number;     // °F, today's low from daily
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

export type ScenarioKey = 'rain_clearing' | 'all_clear' | 'storm_incoming' | 'steady_rain' | 'drizzle' | 'snow_clearing' | 'snowstorm' | 'sleet_mix';

export interface HourlyForecast {
  time: Date;
  condition: Condition;
  precip: number;     // 0–1 intensity
  temp: number;       // °F
  precipProb: number; // 0–100
}
