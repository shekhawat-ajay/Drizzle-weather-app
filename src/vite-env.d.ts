interface ImportMetaEnv {
  readonly WEATHER_BASE_URL: string;
  readonly AIR_QUALITY_BASE_URL: string;
  readonly VITE_GEOCODING_BASE_URL: string;
  // Add more env variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
