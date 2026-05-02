import { describeWeather, windDirection } from '../utils/weatherCodes.js';
import { LOCATION } from '../config.js';

function PressureArrow({ trend }) {
  if (!trend) return null;
  const arrow =
    trend.direction === 'rising' ? '↑' : trend.direction === 'falling' ? '↓' : '→';
  const sign = trend.delta > 0 ? '+' : '';
  const cls = `press-trend press-${trend.direction}`;
  return (
    <span
      className={cls}
      title={`${sign}${trend.delta.toFixed(1)} hPa over ${trend.hours}h (${trend.direction})`}
    >
      {arrow} {sign}{trend.delta.toFixed(1)}
    </span>
  );
}

function WindArrow({ deg, speed, gust }) {
  // deg = direction wind is COMING FROM. The arrow points in the direction
  // the wind is blowing TO (deg + 180).
  const rotation = ((deg ?? 0) + 180) % 360;
  return (
    <div className="wind-arrow">
      <svg
        viewBox="0 0 32 32"
        width={42}
        height={42}
        style={{ transform: `rotate(${rotation}deg)`, transition: 'transform 0.4s' }}
        aria-label={`Wind from ${windDirection(deg)} at ${Math.round(speed)} mph`}
      >
        <circle cx={16} cy={16} r={14} fill="none" stroke="var(--card-border)" strokeWidth="1.5" />
        <path d="M16 4 L21.5 14 L16 11 L10.5 14 Z" fill="var(--accent)" />
        <circle cx={16} cy={16} r={1.5} fill="var(--muted)" />
      </svg>
      <div className="wind-meta">
        <div><strong>{Math.round(speed)}</strong> mph {windDirection(deg)}</div>
        {gust != null && <div className="muted small">Gusts {Math.round(gust)} mph</div>}
      </div>
    </div>
  );
}

export default function CurrentConditions({ current, pressureTrend }) {
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
          Updated{' '}
          {new Date(current.time).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>

      <div className="current-body">
        <div className="current-temp">
          <span className="icon-lg" aria-hidden>{wx.icon}</span>
          <div>
            <div className="temp-lg">{Math.round(current.temperature_2m)}°F</div>
            <div className="muted">{wx.label}</div>
            <div className="muted">Feels like {Math.round(current.apparent_temperature)}°</div>
          </div>
        </div>

        <div className="current-extras">
          <WindArrow
            deg={current.wind_direction_10m}
            speed={current.wind_speed_10m}
            gust={current.wind_gusts_10m}
          />

          <dl className="current-stats">
            <div><dt>Humidity</dt><dd>{current.relative_humidity_2m}%</dd></div>
            <div>
              <dt>Pressure</dt>
              <dd>
                {Math.round(current.pressure_msl)} hPa <PressureArrow trend={pressureTrend} />
              </dd>
            </div>
            <div><dt>Cloud cover</dt><dd>{current.cloud_cover}%</dd></div>
            <div><dt>Precip (last hr)</dt><dd>{current.precipitation.toFixed(2)}″</dd></div>
          </dl>
        </div>
      </div>
    </section>
  );
}
