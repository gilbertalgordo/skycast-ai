import { WeatherData } from "./weatherService";

export interface WeatherInsight {
  summary: string;
  clothing: string[];
  activities: {
    recommended: string[];
    avoid: string[];
  };
  funFact: string;
}

export async function getWeatherInsights(location: string, weather: WeatherData): Promise<WeatherInsight> {
  try {
    const response = await fetch("/api/insights", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ location, weather }),
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("AI Insight Error:", error);
    return {
      summary: `It's currently ${weather.current.temp}°C and ${weather.current.description} in ${location}.`,
      clothing: ["Comfortable casual wear"],
      activities: {
        recommended: ["Check local news"],
        avoid: ["Extreme conditions if forecast is bad"]
      },
      funFact: "Weather patterns are constantly changing!"
    };
  }
}
