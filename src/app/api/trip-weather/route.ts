// src/app/api/trip-weather/route.ts
import { NextRequest, NextResponse } from "next/server";

type Place = { latitude: number; longitude: number; name: string; country: string };

// Photon (OpenStreetMap) ranks by importance and understands local spellings:
// "Milano" -> Milan, Italy, "Wien" -> Vienna, "Prishtina" -> Pristina.
// Open-Meteo's own geocoder returned a 421-person village in Texas for
// "Milano", so it is only a fallback.
async function geocodePhoton(city: string): Promise<Place | null> {
  const res = await fetch(
    `https://photon.komoot.io/api/?q=${encodeURIComponent(city)}&limit=1&layer=city&lang=en`,
    { headers: { "User-Agent": "Occaswear/1.0 (trip planner)" } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  const f = data.features?.[0];
  if (!f) return null;
  const [longitude, latitude] = f.geometry.coordinates;
  return { latitude, longitude, name: f.properties.name, country: f.properties.country ?? "" };
}

async function geocodeOpenMeteo(city: string): Promise<Place | null> {
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=10&language=en&format=json`
  );
  const data = await res.json();
  const results: any[] = data.results ?? [];
  if (!results.length) return null;
  // Largest place wins, not whichever the API lists first.
  const best = results.reduce((a, b) => ((b.population ?? 0) > (a.population ?? 0) ? b : a));
  return { latitude: best.latitude, longitude: best.longitude, name: best.name, country: best.country ?? "" };
}

const isDate = (s: unknown): s is string => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);

export async function POST(req: NextRequest) {
  try {
    const { city, days, startDate, endDate } = await req.json();
    if (!city) return NextResponse.json({ error: "City required" }, { status: 400 });

    // 1. Geocoding - merr lat/lon nga emri i qytetit
    let place: Place | null = null;
    try { place = await geocodePhoton(city); } catch { /* fall through */ }
    if (!place) place = await geocodeOpenMeteo(city);
    if (!place) return NextResponse.json({ error: "City not found" }, { status: 404 });

    const { latitude, longitude, name, country } = place;

    // 2. Weather forecast - for the trip's own dates, not starting today.
    // Open-Meteo forecasts 16 days ahead; the calendar allows up to 14.
    const numDays = Math.min(Math.max(days ?? 4, 1), 16);
    const range = isDate(startDate)
      ? `&start_date=${startDate}&end_date=${isDate(endDate) ? endDate : addDays(startDate, numDays - 1)}`
      : `&forecast_days=${numDays}`;
    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${latitude}&longitude=${longitude}` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode` +
      range +
      `&timezone=auto`
    );
    const weatherData = await weatherRes.json();
    const daily = weatherData.daily;
    if (!daily?.time) return NextResponse.json({ error: "No forecast for those dates" }, { status: 502 });

    // 3. Ndërto array ditësh
    const forecast = daily.time.map((date: string, i: number) => ({
      date,
      tempMax: Math.round(daily.temperature_2m_max[i]),
      tempMin: Math.round(daily.temperature_2m_min[i]),
      tempAvg: Math.round((daily.temperature_2m_max[i] + daily.temperature_2m_min[i]) / 2),
      isRaining: (daily.precipitation_sum[i] ?? 0) > 1,
      weatherCode: daily.weathercode[i],
    }));

    return NextResponse.json({ city: country ? `${name}, ${country}` : name, lat: latitude, lon: longitude, forecast });
  } catch (err) {
    console.error("Trip weather error:", err);
    return NextResponse.json({ error: "Failed to fetch weather" }, { status: 500 });
  }
}

function addDays(date: string, n: number): string {
  const d = new Date(date + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
