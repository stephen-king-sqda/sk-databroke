import { LOCATION, UNITS } from '../config.js';

const BASE = 'https://api.open-meteo.com/v1/forecast';

const HOURLY_VARS = [
  'temperature_2m',
  'apparent_temperature',
  'precipitation_probability',
  'precipitation',
  'weather_code',
  'wind_speed_10m',
  'wind_direction_10m',
  'relative_humidity_2m',
  'cloud_cover',
  'uv_index',
];

const DAILY_VARS = [
  'weather_code',
  'temperature_2m_max',
  'temperature_2m_min',
  'apparent_temperature_max',
  'apparent_temperature_min',
  'sunrise',
  'sunset',
  'uv_index_max',
  'precipitation_sum',
  'precipitation_probability_max',
  'wind_speed_10m_max',
  'wind_direction_10m_dominant',
];

const CURRENT_VARS = [
  'temperature_2m',
  'apparent_temperature',
  'relative_humidity_2m',
  'precipitation',
  'weather_code',
  'wind_speed_10m',
  'wind_direction_10m',
  'wind_gusts_10m',
  'pressure_msl',
  'cloud_cover',
  'is_day',
];

export async function fetchForecast() {
  const params = new URLSearchParams({
    latitude: LOCATION.latitude,
    longitude: LOCATION.longitude,
    timezone: LOCATION.timezone,
    temperature_unit: UNITS.temperature,
    wind_speed_unit: UNITS.windSpeed,
    precipitation_unit: UNITS.precipitation,
    forecast_days: '7',
    current: CURRENT_VARS.join(','),
    hourly: HOURLY_VARS.join(','),
    daily: DAILY_VARS.join(','),
  });

  const res = await fetch(`${BASE}?${params.toString()}`);
  if (!res.ok) throw new Error(`Open-Meteo request failed: ${res.status}`);
  return res.json();
}
