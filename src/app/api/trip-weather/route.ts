// src/app/api/trip-weather/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { city, days } = await req.json();
    if (!city) return NextResponse.json({ error: "City required" }, { status: 400 });

    // 1. Geocoding - merr lat/lon nga emri i qytetit
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
    );
    const geoData = await geoRes.json();
    const place = geoData.results?.[0];
    if (!place) return NextResponse.json({ error: "City not found" }, { status: 404 });

    const { latitude, longitude, name, country } = place;

    // 2. Weather forecast - merr parashikimin për N ditë
    const numDays = Math.min(days ?? 4, 7);
    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${latitude}&longitude=${longitude}` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode` +
      `&forecast_days=${numDays}` +
      `&timezone=auto`
    );
    const weatherData = await weatherRes.json();
    const daily = weatherData.daily;

    // 3. Ndërto array ditësh
    const forecast = daily.time.map((date: string, i: number) => ({
      date,
      tempMax: Math.round(daily.temperature_2m_max[i]),
      tempMin: Math.round(daily.temperature_2m_min[i]),
      tempAvg: Math.round((daily.temperature_2m_max[i] + daily.temperature_2m_min[i]) / 2),
      isRaining: (daily.precipitation_sum[i] ?? 0) > 1,
      weatherCode: daily.weathercode[i],
    }));

    return NextResponse.json({ city: `${name}, ${country}`, lat: latitude, lon: longitude, forecast });
  } catch (err) {
    console.error("Trip weather error:", err);
    return NextResponse.json({ error: "Failed to fetch weather" }, { status: 500 });
  }
}