import { findRiskAtPoint, riskColor, riskName } from '../api/spc.js';
import { LOCATION } from '../config.js';

export default function SPCOutlook({ outlook }) {
  if (!outlook) return null;
  const hit = findRiskAtPoint(outlook, LOCATION.longitude, LOCATION.latitude);
  const label = hit?.label || null;
  const color = riskColor(label);
  const name = riskName(label);

  return (
    <section className="card spc" style={{ borderLeft: `4px solid ${color}` }}>
      <h2>SPC severe weather outlook (today)</h2>
      <div className="spc-body">
        <div className="spc-badge" style={{ background: color }}>{label || 'NONE'}</div>
        <div>
          <div className="spc-name">{name}</div>
          <div className="muted small">
            {hit
              ? `${LOCATION.name} is in the ${name} area for severe weather today.`
              : `${LOCATION.name} is not in any SPC severe outlook area today.`}
          </div>
          <a
            className="muted small"
            href="https://www.spc.noaa.gov/products/outlook/day1otlk.html"
            target="_blank"
            rel="noreferrer"
          >
            View full SPC outlook map ↗
          </a>
        </div>
      </div>
    </section>
  );
}
