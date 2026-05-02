const INDEX_URL = 'https://api.rainviewer.com/public/weather-maps.json';

export async function fetchRadarFrames() {
  const res = await fetch(INDEX_URL);
  if (!res.ok) throw new Error(`RainViewer request failed: ${res.status}`);
  const data = await res.json();
  const past = data.radar?.past || [];
  const nowcast = data.radar?.nowcast || [];
  return {
    host: data.host,
    frames: [...past, ...nowcast],
    generated: data.generated,
  };
}

export function buildRadarTileUrl(host, framePath, { size = 256, color = 2, smooth = 1, snow = 1 } = {}) {
  return `${host}${framePath}/${size}/{z}/{x}/{y}/${color}/${smooth}_${snow}.png`;
}
