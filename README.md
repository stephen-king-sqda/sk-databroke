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

One-shot deploy script (recommended):

```bash
./deploy.sh             # install + build + production preview on :4173 (foreground)
./deploy.sh --daemon    # same, but in the BACKGROUND so closing the terminal
                        # doesn't kill it. Logs to ./preview.log
./deploy.sh --status    # is the daemon running?
./deploy.sh --logs      # tail the daemon log
./deploy.sh --stop      # stop the daemon
./deploy.sh --dev       # install + dev server with HMR on :5173 (foreground)
./deploy.sh --build     # install + build only (output in ./dist)
./deploy.sh --host      # bind to 0.0.0.0 so other LAN devices can reach it
./deploy.sh --port 8080 # override the port
```

Or use npm directly:

```bash
npm install
npm run dev      # http://localhost:5173 (dev, HMR)
npm run build    # produces ./dist
npm run preview  # http://localhost:4173 (serves ./dist)
```

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
