import { LOCATION } from '../config.js';

const BASE = 'https://air-quality-api.open-meteo.com/v1/air-quality';

const CURRENT_VARS = [
  'us_aqi',
  'pm2_5',
  'pm10',
  'ozone',
  'nitrogen_dioxide',
  'sulphur_dioxide',
  'carbon_monoxide',
];

const POLLEN_VARS = [
  'alder_pollen',
  'birch_pollen',
  'grass_pollen',
  'mugwort_pollen',
  'olive_pollen',
  'ragweed_pollen',
];

export async function fetchAirQuality() {
  const params = new URLSearchParams({
    latitude: LOCATION.latitude,
    longitude: LOCATION.longitude,
    timezone: LOCATION.timezone,
    current: CURRENT_VARS.join(','),
    hourly: POLLEN_VARS.join(','),
    forecast_days: '1',
  });
  const res = await fetch(`${BASE}?${params}`);
  if (!res.ok) throw new Error(`Air-quality request failed: ${res.status}`);
  return res.json();
}

export function aqiCategory(aqi) {
  if (aqi == null) return { label: 'Unknown', color: '#888' };
  if (aqi <= 50)  return { label: 'Good',                            color: '#00e400' };
  if (aqi <= 100) return { label: 'Moderate',                        color: '#cc9900' };
  if (aqi <= 150) return { label: 'Unhealthy for Sensitive Groups',  color: '#ff7e00' };
  if (aqi <= 200) return { label: 'Unhealthy',                       color: '#ff0000' };
  if (aqi <= 300) return { label: 'Very Unhealthy',                  color: '#8f3f97' };
  return            { label: 'Hazardous',                            color: '#7e0023' };
}
