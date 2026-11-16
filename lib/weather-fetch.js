// Auspicious — weather and city lookup via Open-Meteo (free, no API key).
// Only rounded city coordinates are sent; nothing about the user is included.
import { local } from './storage.js';

const FORECAST = 'https://api.open-meteo.com/v1/forecast';
const GEOCODE = 'https://geocoding-api.open-meteo.com/v1/search';
const FRESH_MS = 3 * 60 * 60 * 1000;

async function fetchJson(url, timeoutMs) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/** Forecast for a saved location, cached for a few hours. Falls back to stale cache offline. */
export async function getWeather(location, { timeoutMs = 3500, force = false } = {}) {
  if (!location || typeof location.lat !== 'number') return null;
  const lat = Math.round(location.lat * 100) / 100;
  const lon = Math.round(location.lon * 100) / 100;
  const { weatherCache } = await local.get(['weatherCache']);
  const sameSpot = weatherCache && weatherCache.lat === lat && weatherCache.lon === lon;
  if (sameSpot && !force && Date.now() - weatherCache.at < FRESH_MS) return weatherCache.data;
  const url = `${FORECAST}?latitude=${lat}&longitude=${lon}`
    + '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,wind_speed_10m_max,uv_index_max'
    + '&hourly=temperature_2m,precipitation_probability,weather_code&timezone=auto&forecast_days=3';
  try {
    const data = await fetchJson(url, timeoutMs);
    await local.set({ weatherCache: { lat, lon, at: Date.now(), data } });
    return data;
  } catch {
    return sameSpot ? weatherCache.data : null;
  }
}

/** City search for the settings page. */
export async function searchCity(query) {
  const q = query.trim();
  if (q.length < 2) return [];
  const data = await fetchJson(`${GEOCODE}?name=${encodeURIComponent(q)}&count=6&language=en&format=json`, 5000);
  return (data.results || []).map((r) => ({
    name: r.name, admin1: r.admin1 || '', country: r.country || '', countryCode: r.country_code || '',
    lat: r.latitude, lon: r.longitude,
  }));
}
