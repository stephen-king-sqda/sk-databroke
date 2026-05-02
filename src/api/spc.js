// Storm Prediction Center day-1 categorical convective outlook.
// GeoJSON with severe-weather risk polygons. CORS-enabled.
const URL = 'https://www.spc.noaa.gov/products/outlook/day1otlk_cat.lyr.geojson';

export async function fetchSPCOutlook() {
  const res = await fetch(URL);
  if (!res.ok) throw new Error(`SPC request failed: ${res.status}`);
  return res.json();
}

function pointInRing(point, ring) {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersect =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function pointInPolygon(point, polygon) {
  if (!pointInRing(point, polygon[0])) return false;
  for (let i = 1; i < polygon.length; i++) {
    if (pointInRing(point, polygon[i])) return false;
  }
  return true;
}

const RANK = ['TSTM', 'MRGL', 'SLGT', 'ENH', 'MDT', 'HIGH'];

export function findRiskAtPoint(geojson, lon, lat) {
  if (!geojson?.features?.length) return null;
  const point = [lon, lat];
  let best = null;
  for (const f of geojson.features) {
    const props = f.properties || {};
    const label = (props.LABEL || props.label || '').toUpperCase();
    const geom = f.geometry;
    if (!geom) continue;
    let hit = false;
    if (geom.type === 'Polygon') {
      hit = pointInPolygon(point, geom.coordinates);
    } else if (geom.type === 'MultiPolygon') {
      hit = geom.coordinates.some((p) => pointInPolygon(point, p));
    }
    if (hit) {
      const rank = RANK.indexOf(label);
      if (rank > (best?.rank ?? -1)) {
        best = { rank, label, properties: props };
      }
    }
  }
  return best;
}

export function riskColor(label) {
  switch ((label || '').toUpperCase()) {
    case 'TSTM': return '#80c580';
    case 'MRGL': return '#7fc97f';
    case 'SLGT': return '#f6eb14';
    case 'ENH':  return '#e8a33d';
    case 'MDT':  return '#e60000';
    case 'HIGH': return '#ff00ff';
    default:     return '#666';
  }
}

export function riskName(label) {
  return ({
    TSTM: 'General Thunderstorm',
    MRGL: 'Marginal Risk',
    SLGT: 'Slight Risk',
    ENH:  'Enhanced Risk',
    MDT:  'Moderate Risk',
    HIGH: 'High Risk',
  })[(label || '').toUpperCase()] || 'No severe outlook';
}
