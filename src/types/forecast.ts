export interface WeatherCard {
  time: string;
  temp: number;
  weatherCode: number;
  isDay: number;
  humidity: number;
}

export interface SunEvent {
  kind: "sunrise" | "sunset";
  time: string;
  ts: number;
}
