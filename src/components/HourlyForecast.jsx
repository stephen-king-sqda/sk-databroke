import { describeWeather } from '../utils/weatherCodes.js';

export default function HourlyForecast({ hourly }) {
  if (!hourly) return null;

  const now = Date.now();
  const rows = hourly.time
    .map((t, i) => ({
      time: t,
      ts: new Date(t).getTime(),
      temp: hourly.temperature_2m[i],
      pop: hourly.precipitation_probability[i],
      precip: hourly.precipitation[i],
      code: hourly.weather_code[i],
      wind: hourly.wind_speed_10m[i],
    }))
    .filter((r) => r.ts >= now - 60 * 60 * 1000)
    .slice(0, 24);

  return (
    <section className="card">
      <h2>Next 24 hours</h2>
      <div className="hourly-scroll">
        {rows.map((r) => {
          const wx = describeWeather(r.code);
          const d = new Date(r.time);
          const label = d.toLocaleTimeString([], { hour: 'numeric' });
          return (
            <div className="hour-cell" key={r.time}>
              <div className="hour-time">{label}</div>
              <div className="hour-icon" title={wx.label}>{wx.icon}</div>
              <div className="hour-temp">{Math.round(r.temp)}°</div>
              <div className="hour-pop">{r.pop ?? 0}%</div>
              <div className="hour-wind muted">{Math.round(r.wind)} mph</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
