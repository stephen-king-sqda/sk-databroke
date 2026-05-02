import { aqiCategory } from '../api/airQuality.js';

const POLLEN_LABELS = {
  alder_pollen: 'Alder',
  birch_pollen: 'Birch',
  grass_pollen: 'Grass',
  mugwort_pollen: 'Mugwort',
  olive_pollen: 'Olive',
  ragweed_pollen: 'Ragweed',
};

function pollenLevel(v) {
  if (v == null) return null;
  if (v < 1)   return 'None';
  if (v < 20)  return 'Low';
  if (v < 50)  return 'Moderate';
  if (v < 100) return 'High';
  return 'Very High';
}

export default function AirQuality({ data }) {
  if (!data?.current) return null;
  const c = data.current;
  const cat = aqiCategory(c.us_aqi);

  let pollenRows = [];
  if (data.hourly?.time?.length) {
    const now = Date.now();
    const idx = data.hourly.time.findIndex((t) => new Date(t).getTime() >= now);
    const i = Math.max(0, idx);
    pollenRows = Object.keys(POLLEN_LABELS)
      .filter((k) => Array.isArray(data.hourly[k]))
      .map((k) => ({ key: k, label: POLLEN_LABELS[k], value: data.hourly[k][i] }))
      .filter((r) => r.value != null);
  }

  return (
    <section className="card aqi">
      <h2>Air quality &amp; pollen</h2>
      <div className="aqi-row">
        <div className="aqi-main" style={{ borderLeft: `6px solid ${cat.color}` }}>
          <div className="aqi-num">{Math.round(c.us_aqi)}</div>
          <div>
            <div className="aqi-label" style={{ color: cat.color }}>{cat.label}</div>
            <div className="muted small">US AQI</div>
          </div>
        </div>
        <dl className="aqi-stats">
          <div><dt>PM2.5</dt><dd>{c.pm2_5?.toFixed(1)} µg/m³</dd></div>
          <div><dt>PM10</dt><dd>{c.pm10?.toFixed(1)} µg/m³</dd></div>
          <div><dt>Ozone</dt><dd>{c.ozone?.toFixed(0)} µg/m³</dd></div>
          <div><dt>NO₂</dt><dd>{c.nitrogen_dioxide?.toFixed(0)} µg/m³</dd></div>
        </dl>
      </div>

      {pollenRows.length > 0 && (
        <div className="pollen">
          <h3 className="pollen-title">Pollen (now)</h3>
          <div className="pollen-grid">
            {pollenRows.map((r) => (
              <div className="pollen-cell" key={r.key}>
                <div className="muted small">{r.label}</div>
                <div className="pollen-level">{pollenLevel(r.value) ?? '—'}</div>
                <div className="muted small">{r.value?.toFixed(1)} grains/m³</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
