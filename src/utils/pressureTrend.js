// Compute the pressure trend over the last `hours` hours from Open-Meteo's
// hourly pressure_msl array. Returns { delta, direction, hours } or null.
export function pressureTrend(hourly, hours = 3) {
  if (!hourly?.time || !Array.isArray(hourly.pressure_msl)) return null;

  const now = Date.now();
  const series = hourly.time
    .map((t, i) => ({ t: new Date(t).getTime(), p: hourly.pressure_msl[i] }))
    .filter((x) => x.p != null);

  const past = series.filter((x) => x.t <= now);
  if (past.length < 2) return null;

  const current = past[past.length - 1];
  const target = current.t - hours * 3600 * 1000;

  let prev = past[0];
  for (const s of past) {
    if (Math.abs(s.t - target) < Math.abs(prev.t - target)) prev = s;
  }

  const delta = current.p - prev.p;
  let direction = 'steady';
  if (delta > 1) direction = 'rising';
  else if (delta < -1) direction = 'falling';

  return { delta, direction, hours };
}
