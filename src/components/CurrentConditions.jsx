import { describeWeather, windDirection } from '../utils/weatherCodes.js';
import { LOCATION } from '../config.js';

export default function CurrentConditions({ current, units }) {
  if (!current) return null;
  const wx = describeWeather(current.weather_code);

  return (
    <section className="card current">
      <div className="current-header">
        <div>
          <h1>{LOCATION.name}</h1>
          <div className="muted">{LOCATION.region}</div>
        </div>
        <div className="updated muted">
          Updated {new Date(current.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      <div className="current-body">
        <div className="current-temp">
          <span className="icon-lg" aria-hidden>{wx.icon}</span>
          <div>
            <div className="temp-lg">
              {Math.round(current.temperature_2m)}°{units?.temperature_2m?.replace('°', '') || 'F'}
            </div>
            <div className="muted">{wx.label}</div>
            <div className="muted">
              Feels like {Math.round(current.apparent_temperature)}°
            </div>
          </div>
        </div>

        <dl className="current-stats">
          <div><dt>Humidity</dt><dd>{current.relative_humidity_2m}%</dd></div>
          <div><dt>Wind</dt><dd>{Math.round(current.wind_speed_10m)} mph {windDirection(current.wind_direction_10m)}</dd></div>
          <div><dt>Gusts</dt><dd>{Math.round(current.wind_gusts_10m)} mph</dd></div>
          <div><dt>Pressure</dt><dd>{Math.round(current.pressure_msl)} hPa</dd></div>
          <div><dt>Cloud cover</dt><dd>{current.cloud_cover}%</dd></div>
          <div><dt>Precip (last hr)</dt><dd>{current.precipitation.toFixed(2)}″</dd></div>
        </dl>
      </div>
    </section>
  );
}
