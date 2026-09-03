# Drizzle ☁️🔭

Real-time weather, air quality, and astronomy for any city — built with React 19 + Vite 6. Search a location to get current conditions, an hourly temperature chart, today's highlights, NAQI/EU/US air quality with a 24h trend, a 14-day forecast, and a location map. Switch to the Astronomy tab for sun/moon/planet positions, rise/set arcs, planetary events, meteor showers, night-sky quality, and live ISS tracking with 7-day pass predictions.

Live: https://drizzle-weather-app.vercel.app/

## Features

### Weather
- City search with debounced results, recent searches, and favorites
- Current conditions (feels-like, humidity, wind, visibility, UV) with °C/°F toggle
- Hourly temperature chart (24h) with sunrise/sunset markers
- Today's highlights (precipitation, rain chance, UV, cloud cover, sunshine, wind, sunrise/sunset)
- Air quality: India NAQI (CPCB method) + EU/US AQI, pollutant breakdown, 24h trend chart
- Severe weather alerts (rain, wind, UV, thunderstorms) + optional push notifications
- 14-day forecast with timezone-correct Today/Tomorrow labels
- Location map (Street/Satellite/Terrain/Dark layers)
- Compare two favorite cities side-by-side (`/compare`)

### Astronomy
- Celestial overview table (Sun, Moon + 7 planets: altitude, azimuth, magnitude, visibility)
- Sun/Moon/planet detail pages with position arcs and rise/set countdowns
- Planetary events timeline (oppositions, conjunctions, max elongations — 12 months)
- Meteor showers (8 major showers with ZHR, radiant, peak countdown)
- Night-sky quality: stargazing index (0–100) with factor breakdown, 24h cloud chart, best window
- ISS live map, telemetry, and 7-day overhead pass predictions (SGP4 from CelesTrak TLE)

## Tech Stack

- **React 19** + **TypeScript** + **Vite 6** (lazy routes, manual vendor chunks)
- **Tailwind CSS 4** + **DaisyUI 5** (semantic `primary`/`accent` theme tokens; weather = sky, astronomy = violet/amber)
- **SWR** (deduped fetching, retries) + **Axios** (timeout + error mapping) + **Zod** (API validation)
- **Recharts** (forecast/AQI charts), **Leaflet** + **react-leaflet** (maps)
- **astronomy-engine** (rise/set, eclipses, phases) + **satellite.js** (ISS SGP4 propagation)
- **Lucide** icons

## Getting Started

1. Clone the repository

```bash
git clone https://github.com/shekhawat-ajay/Drizzle-weather-app.git
cd Drizzle-weather-app
```

2. Install dependencies

```bash
npm install
```

3. Configure environment — copy `.env.example` to `.env` (defaults point at the public APIs, no keys needed)

```bash
cp .env.example .env
```

4. Start the development server

```bash
npm run dev
```

Other scripts: `npm run build` (production build), `npm run preview`, `npm run lint`.

## Data Sources

See [CREDITS.md](./CREDITS.md) for full attribution — weather/AQI/geocoding by Open-Meteo, ISS telemetry by wheretheiss.at with TLEs by CelesTrak, icons by Meteocons, map tiles by OpenStreetMap/Esri/OpenTopoMap/CARTO.

## License

[MIT](https://choosealicense.com/licenses/mit/)
