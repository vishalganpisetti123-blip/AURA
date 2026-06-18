import * as Location from "expo-location";
import { WeatherCondition } from "@/types/wardrobe";

export interface WeatherData {
  temp: number;
  condition: WeatherCondition;
  description: string;
  icon: string;
  cityName: string;
}

function wmoCodeToCondition(code: number, temp: number): { condition: WeatherCondition; description: string; icon: string } {
  if (code === 0) {
    if (temp >= 85) return { condition: "hot", description: "Hot & Sunny", icon: "sun" };
    if (temp <= 32) return { condition: "cold", description: "Clear & Cold", icon: "thermometer" };
    return { condition: "sunny", description: "Clear Sky", icon: "sun" };
  }
  if (code <= 3) {
    if (temp >= 85) return { condition: "hot", description: "Hot & Partly Cloudy", icon: "sun" };
    if (temp <= 32) return { condition: "cold", description: "Partly Cloudy & Cold", icon: "cloud" };
    return { condition: "cloudy", description: "Partly Cloudy", icon: "cloud" };
  }
  if (code <= 48) {
    if (temp <= 32) return { condition: "cold", description: "Foggy & Cold", icon: "cloud" };
    return { condition: "cloudy", description: "Overcast", icon: "cloud" };
  }
  if (code <= 57) return { condition: "rainy", description: "Light Drizzle", icon: "cloud-rain" };
  if (code <= 67) return { condition: "rainy", description: "Rainy", icon: "cloud-rain" };
  if (code <= 77) return { condition: "snowy", description: "Snowing", icon: "cloud-snow" };
  if (code <= 82) return { condition: "rainy", description: "Rain Showers", icon: "cloud-rain" };
  if (code <= 86) return { condition: "snowy", description: "Snow Showers", icon: "cloud-snow" };
  if (code >= 95) return { condition: "rainy", description: "Thunderstorm", icon: "cloud-lightning" };
  return { condition: "cloudy", description: "Cloudy", icon: "cloud" };
}

export async function fetchWeatherForCoords(lat: number, lon: number): Promise<Omit<WeatherData, "cityName">> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}&current=temperature_2m,weather_code&temperature_unit=fahrenheit&wind_speed_unit=mph&forecast_days=1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Weather fetch failed");
  const data = await res.json();
  const temp = Math.round(data.current.temperature_2m as number);
  const code = data.current.weather_code as number;
  const { condition, description, icon } = wmoCodeToCondition(code, temp);
  return { temp, condition, description, icon };
}

export async function getLocationAndWeather(): Promise<WeatherData | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return null;

    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const { latitude, longitude } = pos.coords;

    const [weatherResult, geocodeResult] = await Promise.allSettled([
      fetchWeatherForCoords(latitude, longitude),
      Location.reverseGeocodeAsync({ latitude, longitude }),
    ]);

    const weather = weatherResult.status === "fulfilled" ? weatherResult.value : null;
    const city =
      geocodeResult.status === "fulfilled" && geocodeResult.value.length > 0
        ? geocodeResult.value[0].city ?? geocodeResult.value[0].subregion ?? ""
        : "";

    if (!weather) return null;
    return { ...weather, cityName: city };
  } catch {
    return null;
  }
}
