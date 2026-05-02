import { LOCATION } from '../config.js';

const BASE = 'https://api.weather.gov';

export async function fetchAlerts() {
  const url = `${BASE}/alerts/active?point=${LOCATION.latitude},${LOCATION.longitude}`;
  const res = await fetch(url, {
    headers: { Accept: 'application/geo+json' },
  });
  if (!res.ok) throw new Error(`NWS alerts request failed: ${res.status}`);
  const data = await res.json();
  return data.features || [];
}
