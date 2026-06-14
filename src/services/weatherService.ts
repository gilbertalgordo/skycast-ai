
export interface LocationData {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string;
}

export interface WeatherData {
  current: {
    temp: number;
    description: string;
    icon: string;
    windSpeed: number;
    humidity: number;
  };
  daily: Array<{
    date: string;
    minTemp: number;
    maxTemp: number;
    description: string;
    icon: string;
  }>;
}

const getIconForCode = (code: number): string => {
  // WMO Weather interpretation codes (WW)
  // https://open-meteo.com/en/docs
  if (code === 0) return "Sun"; // Clear sky
  if (code >= 1 && code <= 3) return "CloudSun"; // Mainly clear, partly cloudy, and overcast
  if (code >= 45 && code <= 48) return "CloudFog"; // Fog and depositing rime fog
  if (code >= 51 && code <= 55) return "CloudDrizzle"; // Drizzle: Light, moderate, and dense intensity
  if (code >= 61 && code <= 65) return "CloudRain"; // Rain: Slight, moderate and heavy intensity
  if (code >= 71 && code <= 77) return "Snowflake"; // Snow fall: Slight, moderate, and heavy intensity
  if (code >= 80 && code <= 82) return "CloudRain"; // Rain showers: Slight, moderate, and violent
  if (code >= 95 && code <= 99) return "CloudLightning"; // Thunderstorm: Slight or moderate
  return "Cloud";
};

const getDescriptionForCode = (code: number): string => {
  const codes: Record<number, string> = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    71: "Slight snow",
    73: "Moderate snow",
    75: "Heavy snow",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    95: "Slight thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
  };
  return codes[code] || "Unknown";
};

export async function searchLocation(query: string): Promise<LocationData[]> {
  if (!query || query.length < 2) return [];
  // Clean query for better search results
  const cleanQuery = query.trim();
  const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cleanQuery)}&count=5&language=en&format=json`);
  const data = await res.json();
  return data.results || [];
}

export async function getWeatherData(lat: number, lon: number): Promise<WeatherData> {
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`);
  const data = await res.json();

  if (!data || !data.current || !data.daily) {
    throw new Error("Invalid weather data received.");
  }

  return {
    current: {
      temp: Math.round(data.current.temperature_2m),
      description: getDescriptionForCode(data.current.weather_code),
      icon: getIconForCode(data.current.weather_code),
      windSpeed: Math.round(data.current.wind_speed_10m),
      humidity: data.current.relative_humidity_2m,
    },
    daily: data.daily.time.slice(0, 3).map((time: string, i: number) => {
      const code = data.daily.weather_code[i];
      return {
        date: time,
        minTemp: Math.round(data.daily.temperature_2m_min[i]),
        maxTemp: Math.round(data.daily.temperature_2m_max[i]),
        description: getDescriptionForCode(code),
        icon: getIconForCode(code),
      };
    })
  };
}
