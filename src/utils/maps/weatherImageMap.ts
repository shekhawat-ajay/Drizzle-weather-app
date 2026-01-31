export const weatherImageMap: {
  [key: string]: { imageSrc: string; description: string };
} = {
  "0d": {
    imageSrc: "/clear-day.svg",
    description: "Clear Sky",
  },
  "0n": {
    imageSrc: "/clear-night.svg",
    description: "Clear Sky",
  },
  "1d": {
    imageSrc: "/clear-day.svg",
    description: "Mostly Clear Sky",
  },
  "1n": {
    imageSrc: "/clear-night.svg",
    description: "Mostly Clear Sky",
  },
  "2d": {
    imageSrc: "/partly-cloudy-day.svg",
    description: "Partly Cloudy",
  },
  "2n": {
    imageSrc: "/partly-cloudy-night.svg",
    description: "Partly Cloudy",
  },
  "3d": {
    imageSrc: "/overcast-day.svg",
    description: "Overcast",
  },
  "3n": {
    imageSrc: "/overcast-night.svg",
    description: "Overcast",
  },
  "45d": {
    imageSrc: "/fog-day.svg",
    description: "Fog",
  },
  "45n": {
    imageSrc: "/fog-night.svg",
    description: "Fog",
  },
  "48d": {
    imageSrc: "/fog-day.svg",
    description: "Rime Fog",
  },
  "48n": {
    imageSrc: "/fog-night.svg",
    description: "Rime Fog",
  },
  "51d": {
    imageSrc: "/partly-cloudy-day-drizzle.svg",
    description: "Light Drizzle",
  },
  "51n": {
    imageSrc: "/partly-cloudy-night-drizzle.svg",
    description: "Light Drizzle",
  },
  "53d": {
    imageSrc: "/partly-cloudy-day-drizzle.svg",
    description: "Moderate Drizzle",
  },
  "53n": {
    imageSrc: "/partly-cloudy-night-drizzle.svg",
    description: "Moderate Drizzle",
  },
  "55d": {
    imageSrc: "/partly-cloudy-day-drizzle.svg",
    description: "Heavy Drizzle",
  },
  "55n": {
    imageSrc: "/partly-cloudy-night-drizzle.svg",
    description: "Heavy Drizzle",
  },
  "56d": {
    imageSrc: "/partly-cloudy-day-drizzle.svg",
    description: "Light Freezing Drizzle",
  },
  "56n": {
    imageSrc: "/partly-cloudy-night-drizzle.svg",
    description: "Light Freezing Drizzle",
  },
  "57d": {
    imageSrc: "/partly-cloudy-day-drizzle.svg",
    description: "Heavy Freezing Drizzle",
  },
  "57n": {
    imageSrc: "/partly-cloudy-night-drizzle.svg",
    description: "Heavy Freezing Drizzle",
  },
  "61d": {
    imageSrc: "/partly-cloudy-day-rain.svg",
    description: "Light Rain",
  },
  "61n": {
    imageSrc: "/partly-cloudy-night-rain.svg",
    description: "Light Rain",
  },
  "63d": {
    imageSrc: "/partly-cloudy-day-rain.svg",
    description: "Moderate Rain",
  },
  "63n": {
    imageSrc: "/partly-cloudy-night-rain.svg",
    description: "Moderate Rain",
  },
  "65d": {
    imageSrc: "/partly-cloudy-day-rain.svg",
    description: "Heavy Rain",
  },
  "65n": {
    imageSrc: "/partly-cloudy-night-rain.svg",
    description: "Heavy Rain",
  },
  "66d": {
    imageSrc: "/partly-cloudy-day-sleet.svg",
    description: "Light Freezing Rain",
  },
  "66n": {
    imageSrc: "/partly-cloudy-night-sleet.svg",
    description: "Light Freezing Rain",
  },
  "67d": {
    imageSrc: "/partly-cloudy-day-sleet.svg",
    description: "Heavy Freezing Rain",
  },
  "67n": {
    imageSrc: "/partly-cloudy-night-sleet.svg",
    description: "Heavy Freezing Rain",
  },
  "71d": {
    imageSrc: "/partly-cloudy-day-snow.svg",
    description: "Light Snowfall",
  },
  "71n": {
    imageSrc: "/partly-cloudy-night-snow.svg",
    description: "Light Snowfall",
  },
  "73d": {
    imageSrc: "/partly-cloudy-day-snow.svg",
    description: "Moderate Snowfall",
  },
  "73n": {
    imageSrc: "/partly-cloudy-night-snow.svg",
    description: "Moderate Snowfall",
  },
  "75d": {
    imageSrc: "/partly-cloudy-day-snow.svg",
    description: "Heavy Snowfall",
  },
  "75n": {
    imageSrc: "/partly-cloudy-night-snow.svg",
    description: "Heavy Snowfall",
  },
  "77d": {
    imageSrc: "/partly-cloudy-day-hail.svg",
    description: "Snow Grains",
  },
  "77n": {
    imageSrc: "/partly-cloudy-night-hail.svg",
    description: "Snow Grains",
  },
  "80d": {
    imageSrc: "/rain.svg",
    description: "Slight Rain Showers",
  },
  "80n": {
    imageSrc: "/rain.svg",
    description: "Slight Rain Showers",
  },
  "81d": {
    imageSrc: "/rain.svg",
    description: "Moderate Rain Showers",
  },
  "81n": {
    imageSrc: "/rain.svg",
    description: "Moderate Rain Showers",
  },
  "82d": {
    imageSrc: "/rain.svg",
    description: "Heavy Rain Showers",
  },
  "82n": {
    imageSrc: "/rain.svg",
    description: "Heavy Rain Showers",
  },
  "85d": {
    imageSrc: "/snow.svg",
    description: "Light Snow Showers",
  },
  "85n": {
    imageSrc: "/snow.svg",
    description: "Light Snow Showers",
  },
  "86d": {
    imageSrc: "/snow.svg",
    description: "Heavy Snow Showers",
  },
  "86n": {
    imageSrc: "/snow.svg",
    description: "Heavy Snow Showers",
  },
  "95d": {
    imageSrc: "/thunderstorms-day.svg",
    description: "Thunderstorm",
  },
  "95n": {
    imageSrc: "/thunderstorms-night.svg",
    description: "Thunderstorm",
  },
  "96d": {
    imageSrc: "/thunderstorms-day-rain.svg",
    description: "Thunderstorm with Light Hail",
  },
  "96n": {
    imageSrc: "/thunderstorms-night-rain.svg",
    description: "Thunderstorm with Light Hail",
  },
  "99d": {
    imageSrc: "/thunderstorms-day-rain.svg",
    description: "Thunderstorm with Heavy Hail",
  },
  "99n": {
    imageSrc: "/thunderstorms-night-rain.svg",
    description: "Thunderstorm with Heavy Hail",
  },
};
