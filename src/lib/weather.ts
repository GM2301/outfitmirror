import { z } from "zod";

export type WeatherContext = {
  city?: string; // optional (s’po e përdorim 100%)
  lat: number;
  lon: number;
  tempC: number;
  isRaining: boolean;
  windKph: number;
};

export async function getBrowserLocation(timeoutMs = 8000): Promise<{ lat: number; lon: number }> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }

    const t = setTimeout(() => reject(new Error("Location timeout")), timeoutMs);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(t);
        resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      },
      (err) => {
        clearTimeout(t);
        reject(new Error(err.message || "Location denied"));
      },
      { enableHighAccuracy: false, maximumAge: 5 * 60 * 1000, timeout: timeoutMs }
    );
  });
}

// Open-Meteo (free)
const MeteoSchema = z.object({
  current: z.object({
    temperature_2m: z.number(),
    wind_speed_10m: z.number(),
    precipitation: z.number().optional(),
    rain: z.number().optional(),
    showers: z.number().optional(),
    snowfall: z.number().optional(),
  }),
});

export async function fetchWeather(lat: number, lon: number): Promise<WeatherContext> {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,wind_speed_10m,precipitation,rain,showers,snowfall` +
    `&wind_speed_unit=kmh`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Weather fetch failed");

  const json = await res.json();
  const parsed = MeteoSchema.parse(json);

  const c = parsed.current;
  const precip =
    (c.precipitation ?? 0) + (c.rain ?? 0) + (c.showers ?? 0) + (c.snowfall ?? 0);

  return {
    lat,
    lon,
    tempC: c.temperature_2m,
    windKph: c.wind_speed_10m,
    isRaining: precip > 0,
  };
}
