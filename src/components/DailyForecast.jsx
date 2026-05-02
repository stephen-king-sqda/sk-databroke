import { describeWeather } from '../utils/weatherCodes.js';

export default function DailyForecast({ daily }) {
  if (!daily) return null;

  const rows = daily.time.map((t, i) => ({
    time: t,
    code: daily.weather_code[i],
    tmax: daily.temperature_2m_max[i],
    tmin: daily.temperature_2m_min[i],
    pop: daily.precipitation_probability_max[i],
    precip: daily.precipitation_sum[i],
    wind: daily.wind_speed_10m_max[i],
    sunrise: daily.sunrise[i],
    sunset: daily.sunset[i],
    uv: daily.uv_index_max[i],
  }));

  return (
    <section className="card">
      <h2>7-day forecast</h2>
      <div className="daily-grid">
        {rows.map((r, idx) => {
          const wx = describeWeather(r.code);
          const d = new Date(r.time);
          const label = idx === 0 ? 'Today' : d.toLocaleDateString([], { weekday: 'short' });
          const sub = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
          return (
            <div className="day-row" key={r.time}>
              <div className="day-name">
                <div>{label}</div>
                <div className="muted small">{sub}</div>
              </div>
              <div className="day-icon" title={wx.label}>{wx.icon}</div>
              <div className="day-pop">{r.pop ?? 0}%</div>
              <div className="day-precip muted">{r.precip?.toFixed(2)}″</div>
              <div className="day-temps">
                <span className="t-max">{Math.round(r.tmax)}°</span>
                <span className="muted"> / {Math.round(r.tmin)}°</span>
              </div>
              <div className="day-extras muted small">
                UV {Math.round(r.uv)} · Wind {Math.round(r.wind)} mph
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
