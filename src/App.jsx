import { useEffect, useMemo, useRef, useState } from 'react';
import { fetchForecast } from './api/openMeteo.js';
import { fetchAlerts } from './api/nws.js';
import { fetchAirQuality } from './api/airQuality.js';
import { fetchSPCOutlook } from './api/spc.js';
import { pressureTrend } from './utils/pressureTrend.js';
import CurrentConditions from './components/CurrentConditions.jsx';
import SunMoonStrip from './components/SunMoonStrip.jsx';
import HourlyForecast from './components/HourlyForecast.jsx';
import DailyForecast from './components/DailyForecast.jsx';
import Alerts from './components/Alerts.jsx';
import RyanHallPanel from './components/RyanHallPanel.jsx';
import AirQuality from './components/AirQuality.jsx';
import SPCOutlook from './components/SPCOutlook.jsx';
import LightningPanel from './components/LightningPanel.jsx';
import RadarMap from './components/RadarMap.jsx';
import { LOCATION } from './config.js';
import './App.css';

const REFRESH_MS = 10 * 60 * 1000;

function useBrowserTitle(temp) {
  useEffect(() => {
    if (temp == null) return;
    document.title = `${Math.round(temp)}° • ${LOCATION.name}`;
  }, [temp]);
}

function useAlertNotifications(alerts) {
  // Ask for permission once, after the user's first click (browsers block
  // automatic prompts on page load).
  useEffect(() => {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'default') return;
    const ask = () => {
      Notification.requestPermission();
      window.removeEventListener('click', ask);
    };
    window.addEventListener('click', ask, { once: true });
    return () => window.removeEventListener('click', ask);
  }, []);

  // Fire a notification for any alert id we haven't seen yet.
  const seenRef = useRef(new Set());
  // First render: seed with current alert IDs so we don't notify for old alerts.
  const seededRef = useRef(false);

  useEffect(() => {
    if (!alerts) return;
    if (!seededRef.current) {
      for (const a of alerts) seenRef.current.add(a.id);
      seededRef.current = true;
      return;
    }
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    for (const a of alerts) {
      if (seenRef.current.has(a.id)) continue;
      seenRef.current.add(a.id);
      const p = a.properties || {};
      try {
        new Notification(`⚠️ ${p.event} — ${LOCATION.name}`, {
          body: p.headline || '',
          tag: a.id,
          requireInteraction: (p.severity || '').toLowerCase() === 'extreme',
        });
      } catch {}
    }
  }, [alerts]);
}

export default function App() {
  const [forecast, setForecast] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [airQuality, setAirQuality] = useState(null);
  const [outlook, setOutlook] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [fc, al, aq, sp] = await Promise.all([
          fetchForecast(),
          fetchAlerts().catch(() => []),
          fetchAirQuality().catch(() => null),
          fetchSPCOutlook().catch(() => null),
        ]);
        if (cancelled) return;
        setForecast(fc);
        setAlerts(al);
        setAirQuality(aq);
        setOutlook(sp);
        setUpdatedAt(new Date());
        setError(null);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const id = setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const trend = useMemo(() => pressureTrend(forecast?.hourly), [forecast]);

  useBrowserTitle(forecast?.current?.temperature_2m);
  useAlertNotifications(alerts);

  if (loading && !forecast) {
    return (
      <main className="app">
        <p className="muted">Loading forecast…</p>
      </main>
    );
  }

  return (
    <main className="app">
      {error && <div className="card error">Error: {error}</div>}

      <CurrentConditions current={forecast?.current} pressureTrend={trend} />

      <SunMoonStrip daily={forecast?.daily} />

      <Alerts alerts={alerts} />

      <RyanHallPanel alerts={alerts} />

      <SPCOutlook outlook={outlook} />

      <HourlyForecast hourly={forecast?.hourly} />

      <DailyForecast daily={forecast?.daily} />

      <AirQuality data={airQuality} />

      <RadarMap />

      <LightningPanel />

      <footer className="footer muted small">
        Data:{' '}
        <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a>{' '}
        · <a href="https://www.weather.gov/" target="_blank" rel="noreferrer">NWS</a>{' '}
        · <a href="https://www.spc.noaa.gov/" target="_blank" rel="noreferrer">SPC</a>{' '}
        · <a href="https://www.rainviewer.com/" target="_blank" rel="noreferrer">RainViewer</a>{' '}
        · <a href="https://www.blitzortung.org/" target="_blank" rel="noreferrer">Blitzortung</a>
        {updatedAt && <> · Last update {updatedAt.toLocaleTimeString()}</>}
      </footer>
    </main>
  );
}
