import { useEffect, useState } from 'react';
import { fetchForecast } from './api/openMeteo.js';
import { fetchAlerts } from './api/nws.js';
import CurrentConditions from './components/CurrentConditions.jsx';
import HourlyForecast from './components/HourlyForecast.jsx';
import DailyForecast from './components/DailyForecast.jsx';
import Alerts from './components/Alerts.jsx';
import RyanHallPanel from './components/RyanHallPanel.jsx';
import RadarMap from './components/RadarMap.jsx';
import './App.css';

const REFRESH_MS = 10 * 60 * 1000;

export default function App() {
  const [forecast, setForecast] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [fc, al] = await Promise.all([
          fetchForecast(),
          fetchAlerts().catch(() => []),
        ]);
        if (cancelled) return;
        setForecast(fc);
        setAlerts(al);
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

      <CurrentConditions current={forecast?.current} units={forecast?.current_units} />

      <Alerts alerts={alerts} />

      <RyanHallPanel alerts={alerts} />

      <HourlyForecast hourly={forecast?.hourly} />

      <DailyForecast daily={forecast?.daily} />

      <RadarMap />

      <footer className="footer muted small">
        Data: <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a>{' '}
        · <a href="https://www.weather.gov/" target="_blank" rel="noreferrer">NWS</a>{' '}
        · <a href="https://www.rainviewer.com/" target="_blank" rel="noreferrer">RainViewer</a>
        {updatedAt && <> · Last update {updatedAt.toLocaleTimeString()}</>}
      </footer>
    </main>
  );
}
