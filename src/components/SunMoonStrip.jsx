import { useEffect, useState } from 'react';
import { moonPhase } from '../utils/moonPhase.js';

function fmtTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function untilString(target) {
  const ms = target - Date.now();
  if (ms <= 0) return null;
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h ${m}m`;
}

export default function SunMoonStrip({ daily }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 60000);
    return () => clearInterval(id);
  }, []);

  if (!daily?.sunrise) return null;

  const now = Date.now();
  const sunrise = new Date(daily.sunrise[0]);
  const sunset = new Date(daily.sunset[0]);
  const tomorrowSunrise = daily.sunrise[1] ? new Date(daily.sunrise[1]) : null;

  let label = 'Daylight remaining';
  let count = '—';
  if (now < sunrise.getTime()) {
    label = 'Sunrise in';
    count = untilString(sunrise.getTime());
  } else if (now < sunset.getTime()) {
    label = 'Daylight remaining';
    count = untilString(sunset.getTime());
  } else if (tomorrowSunrise) {
    label = 'Sunrise in';
    count = untilString(tomorrowSunrise.getTime());
  }

  const moon = moonPhase(new Date());
  const totalDay = sunset.getTime() - sunrise.getTime();
  const elapsed = Math.max(0, Math.min(totalDay, now - sunrise.getTime()));
  const pct = totalDay > 0 ? (elapsed / totalDay) * 100 : 0;

  return (
    <section className="card sunmoon">
      <div className="sunmoon-row">
        <div className="sunmoon-cell">
          <div className="sm-icon">🌅</div>
          <div className="sm-label muted small">Sunrise</div>
          <div className="sm-value">{fmtTime(daily.sunrise[0])}</div>
        </div>
        <div className="sunmoon-arc">
          <div className="sm-label muted small">{label}</div>
          <div className="sm-count">{count || '—'}</div>
          <div className="sm-progress">
            <div className="sm-progress-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="sunmoon-cell">
          <div className="sm-icon">🌇</div>
          <div className="sm-label muted small">Sunset</div>
          <div className="sm-value">{fmtTime(daily.sunset[0])}</div>
        </div>
        <div className="sunmoon-cell">
          <div className="sm-icon">{moon.emoji}</div>
          <div className="sm-label muted small">Moon</div>
          <div className="sm-value">{moon.name}</div>
          <div className="muted small">{moon.illumination}% lit</div>
        </div>
      </div>
    </section>
  );
}
