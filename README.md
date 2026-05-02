# Bella Vista Weather

A self-hosted React weather dashboard for Bella Vista, AR (Northwest Arkansas), built on free, open data.

## Data sources

| Source | Used for | Auth |
|---|---|---|
| [Open-Meteo](https://open-meteo.com/) | Current conditions, hourly + 7-day forecast | None |
| [NWS API](https://www.weather.gov/documentation/services-web-api) | Active weather alerts | None |
| [RainViewer](https://www.rainviewer.com/api.html) | Animated radar tiles (past 2h + 30 min nowcast) | None |
| [OpenStreetMap](https://www.openstreetmap.org/) | Basemap tiles | None |

No API keys, no signup, no paid services.

## Run locally

### Windows (recommended path)

Easiest: **double-click `deploy.bat`**. It will:
1. Install dependencies (first run only)
2. Build the production bundle
3. Start the server in the background (survives closing the window)
4. Open `http://localhost:4173/` in your browser

| Command | What it does |
|---|---|
| `deploy.bat`        | Start in background + open browser |
| `deploy.bat stop`   | Stop the background server |
| `deploy.bat status` | Is it running? |
| `deploy.bat logs`   | Tail the log |
| `deploy.bat dev`    | Run the dev server (HMR) in this window |

From PowerShell directly:

```powershell
.\deploy.ps1 -Daemon     # build + run in background
.\deploy.ps1 -Stop       # stop background server
.\deploy.ps1 -Status     # status
.\deploy.ps1 -Logs       # tail log
.\deploy.ps1 -Dev        # foreground dev server (Ctrl+C to stop)
.\deploy.ps1 -Build      # build only
.\deploy.ps1 -LanHost    # bind 0.0.0.0 (LAN access)
.\deploy.ps1 -Port 8080  # custom port
```

> If PowerShell blocks the script with an execution-policy error, run it
> through `.\deploy.bat` instead (the .bat wraps it with `-ExecutionPolicy Bypass`).

### macOS / Linux

```bash
./deploy.sh             # build + foreground preview on :4173
./deploy.sh --daemon    # build + run in background (survives terminal close)
./deploy.sh --stop      # stop daemon
./deploy.sh --status    # status
./deploy.sh --logs      # tail log
./deploy.sh --dev       # dev server with HMR on :5173
./deploy.sh --build     # build only
./deploy.sh --host      # bind 0.0.0.0 (LAN access)
./deploy.sh --port 8080 # custom port
```

### Plain npm (any OS)

```bash
npm install
npm run dev      # http://localhost:5173 (dev, HMR)
npm run build    # produces ./dist
npm run preview  # http://localhost:4173 (serves ./dist)
```

**Prerequisite:** [Node.js 18+](https://nodejs.org/) installed.

## Change location

Edit `src/config.js`:

```js
export const LOCATION = {
  name: 'Bella Vista, AR',
  region: 'Northwest Arkansas',
  latitude: 36.4814,
  longitude: -94.273,
  timezone: 'America/Chicago',
};
```

## Project layout

```
src/
  App.jsx                  Top-level layout, refresh loop
  config.js                Location + units
  api/
    openMeteo.js           Forecast fetcher
    nws.js                 Alerts fetcher
    rainviewer.js          Radar frame index + tile URL builder
  components/
    CurrentConditions.jsx  Big "right now" card
    HourlyForecast.jsx     Scrolling 24-hour strip
    DailyForecast.jsx      7-day list
    Alerts.jsx             NWS active alerts
    RadarMap.jsx           Leaflet map + animated radar overlay
  utils/
    weatherCodes.js        WMO code → label/emoji
```

## Notes

- Data refreshes every 10 minutes; radar refreshes every 5 minutes.
- All requests are made directly from the browser; no backend required.
- Open-Meteo's free tier is for non-commercial use.
