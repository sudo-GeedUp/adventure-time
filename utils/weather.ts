import AsyncStorage from "@react-native-async-storage/async-storage";
import { WeatherCondition } from "./conditions";

const CACHE_DURATION_MS = 30 * 60 * 1000;
const CACHE_KEY_PREFIX = "@trailguard/weather_cache";

interface CachedWeather {
  data: WeatherCondition;
  timestamp: number;
}

export async function fetchWeatherFromNWS(
  latitude: number,
  longitude: number
): Promise<WeatherCondition | null> {
  try {
    const pointsUrl = `https://api.weather.gov/points/${latitude.toFixed(4)},${longitude.toFixed(4)}`;
    
    const pointsResponse = await fetch(pointsUrl, {
      headers: {
        "User-Agent": "(Adventure Time Offroad App, contact@adventuretime.app)",
      },
    });

    if (!pointsResponse.ok) {
      console.error("NWS points API error:", pointsResponse.status);
      return null;
    }

    const pointsData = await pointsResponse.json();
    const forecastUrl = pointsData.properties?.forecast;

    if (!forecastUrl) {
      console.error("No forecast URL in NWS response");
      return null;
    }

    const forecastResponse = await fetch(forecastUrl, {
      headers: {
        "User-Agent": "(Adventure Time Offroad App, contact@adventuretime.app)",
      },
    });

    if (!forecastResponse.ok) {
      console.error("NWS forecast API error:", forecastResponse.status);
      return null;
    }

    const forecastData = await forecastResponse.json();
    const currentPeriod = forecastData.properties?.periods?.[0];

    if (!currentPeriod) {
      console.error("No forecast periods in NWS response");
      return null;
    }

    const windSpeedValue = parseWindSpeed(currentPeriod.windSpeed);

    const weatherCondition: WeatherCondition = {
      condition: currentPeriod.shortForecast || "Unknown",
      temperature: currentPeriod.temperature || 0,
      windSpeed: windSpeedValue,
      description: currentPeriod.detailedForecast || currentPeriod.shortForecast || "No description available",
    };

    return weatherCondition;
  } catch (error) {
    console.error("Error fetching weather from NWS:", error);
    return null;
  }
}

export async function getWeather(
  latitude: number,
  longitude: number
): Promise<WeatherCondition | null> {
  const cacheKey = `${CACHE_KEY_PREFIX}_${latitude.toFixed(4)}_${longitude.toFixed(4)}`;

  try {
    const cachedData = await AsyncStorage.getItem(cacheKey);
    
    if (cachedData) {
      const cached: CachedWeather = JSON.parse(cachedData);
      const age = Date.now() - cached.timestamp;

      if (age < CACHE_DURATION_MS) {
        console.log("Returning cached weather data");
        return cached.data;
      }
    }
  } catch (error) {
    console.error("Error reading weather cache:", error);
  }

  const freshWeather = await fetchWeatherFromNWS(latitude, longitude);

  if (freshWeather) {
    try {
      const cacheData: CachedWeather = {
        data: freshWeather,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
      console.log("Weather data cached successfully");
    } catch (error) {
      console.error("Error caching weather data:", error);
    }
    return freshWeather;
  }

  try {
    const cachedData = await AsyncStorage.getItem(cacheKey);
    if (cachedData) {
      const cached: CachedWeather = JSON.parse(cachedData);
      console.log("API failed, returning stale cached weather data");
      return cached.data;
    }
  } catch (error) {
    console.error("Error reading stale cache:", error);
  }

  return null;
}

export async function clearWeatherCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const weatherCacheKeys = keys.filter((key) => key.startsWith(CACHE_KEY_PREFIX));
    
    if (weatherCacheKeys.length > 0) {
      await AsyncStorage.multiRemove(weatherCacheKeys);
      console.log(`Cleared ${weatherCacheKeys.length} weather cache entries`);
    }
  } catch (error) {
    console.error("Error clearing weather cache:", error);
  }
}

function parseWindSpeed(windSpeedString: string): number {
  if (!windSpeedString) {
    return 0;
  }

  const match = windSpeedString.match(/(\d+)/);
  if (match) {
    return parseInt(match[1], 10);
  }

  return 0;
}
