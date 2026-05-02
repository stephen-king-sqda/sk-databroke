import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { fetchRadarFrames, buildRadarTileUrl } from '../api/rainviewer.js';
import { LOCATION } from '../config.js';

// Fix Leaflet default marker icons under bundlers.
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function RadarLayer({ host, frame, opacity }) {
  const map = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
    if (!host || !frame) return;
    const url = buildRadarTileUrl(host, frame.path);
    const layer = L.tileLayer(url, { opacity, zIndex: 500, tileSize: 256 });
    layer.addTo(map);
    layerRef.current = layer;
    return () => {
      map.removeLayer(layer);
    };
  }, [map, host, frame, opacity]);

  return null;
}

export default function RadarMap() {
  const [host, setHost] = useState(null);
  const [frames, setFrames] = useState([]);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [opacity, setOpacity] = useState(0.75);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await fetchRadarFrames();
        if (cancelled) return;
        setHost(data.host);
        setFrames(data.frames);
        // Start at the most recent past frame.
        const past = data.frames.filter((f) => f.path.includes('/radar/'));
        const startIdx = Math.max(0, past.findIndex((f) => f === data.frames[data.frames.length - 1]) - 0);
        setIdx(Math.max(0, data.frames.length - 3));
      } catch (e) {
        setError(e.message);
      }
    }
    load();
    const refresh = setInterval(load, 5 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(refresh);
    };
  }, []);

  useEffect(() => {
    if (!playing || frames.length === 0) return;
    const id = setInterval(() => {
      setIdx((i) => (i + 1) % frames.length);
    }, 600);
    return () => clearInterval(id);
  }, [playing, frames.length]);

  const current = frames[idx];
  const stamp = current ? new Date(current.time * 1000) : null;

  return (
    <section className="card radar">
      <div className="radar-header">
        <h2>Live radar</h2>
        {stamp && (
          <span className="muted small">
            Frame: {stamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            {current.path.includes('nowcast') ? ' (forecast)' : ''}
          </span>
        )}
      </div>

      <div className="radar-map-wrap">
        <MapContainer
          center={[LOCATION.latitude, LOCATION.longitude]}
          zoom={8}
          scrollWheelZoom
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {host && current && <RadarLayer host={host} frame={current} opacity={opacity} />}
          <Marker position={[LOCATION.latitude, LOCATION.longitude]}>
            <Popup>{LOCATION.name}</Popup>
          </Marker>
        </MapContainer>
      </div>

      <div className="radar-controls">
        <button onClick={() => setPlaying((p) => !p)}>
          {playing ? 'Pause' : 'Play'}
        </button>
        <input
          type="range"
          min={0}
          max={Math.max(0, frames.length - 1)}
          value={idx}
          onChange={(e) => {
            setPlaying(false);
            setIdx(Number(e.target.value));
          }}
        />
        <label className="muted small">
          Opacity
          <input
            type="range"
            min={0.2}
            max={1}
            step={0.05}
            value={opacity}
            onChange={(e) => setOpacity(Number(e.target.value))}
          />
        </label>
      </div>

      {error && <p className="error">Radar error: {error}</p>}
      <p className="muted small">
        Radar tiles &copy; <a href="https://www.rainviewer.com/" target="_blank" rel="noreferrer">RainViewer</a>.
        Map &copy; OpenStreetMap.
      </p>
    </section>
  );
}
