import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { assessWeather, decodeCode, fmtClock, fmtTemp } from '../lib/weather.js';
import { buildFortune } from '../lib/fortune-engine.js';

const seattle = JSON.parse(readFileSync(new URL('./fixtures/seattle-2026-11-15.json', import.meta.url)));
const profile = { birthDate: '1990-07-15', role: 'engineer', workDays: [1, 2, 3, 4, 5] };

/** Build a synthetic one-day forecast. */
function forecast(key, { code = 0, tmax = 19, tmin = 9, rain = 5, wind = 10 } = {}) {
  const hours = Array.from({ length: 24 }, (_, h) => `${key}T${String(h).padStart(2, '0')}:00`);
  return {
    daily: {
      time: [key], weather_code: [code], temperature_2m_max: [tmax], temperature_2m_min: [tmin],
      precipitation_probability_max: [rain], wind_speed_10m_max: [wind], uv_index_max: [3],
      sunrise: [`${key}T07:00`], sunset: [`${key}T17:00`],
    },
    hourly: {
      time: hours,
      temperature_2m: hours.map((_, h) => tmin + (tmax - tmin) * Math.max(0, Math.sin(((h - 6) / 12) * Math.PI))),
      precipitation_probability: hours.map(() => rain),
      weather_code: hours.map(() => code),
    },
  };
}

test('weather codes decode', () => {
  assert.equal(decodeCode(0).kind, 'clear');
  assert.equal(decodeCode(63).kind, 'rain');
  assert.equal(decodeCode(95).kind, 'storm');
  assert.equal(fmtClock(16.5), '4:30 pm');
  assert.equal(fmtTemp(20, 'f'), '68°');
});

test('real Open-Meteo response is assessed per date', () => {
  const day1 = assessWeather(seattle, '2026-11-15', profile, false);
  assert.ok(day1 && day1.verdict && day1.reasons.length);
  assert.equal(assessWeather(seattle, '2030-01-01', profile), null);
});

test('verdicts', () => {
  const k = '2026-11-15';
  assert.equal(assessWeather(forecast(k), k, profile).verdict, 'great');
  assert.equal(assessWeather(forecast(k, { code: 63, rain: 80 }), k, profile).verdict, 'wet');
  assert.equal(assessWeather(forecast(k, { code: 95, rain: 70 }), k, profile).verdict, 'caution');
  assert.equal(assessWeather(forecast(k, { tmax: 37 }), k, profile).verdict, 'caution');
  assert.ok(assessWeather(forecast(k), k, profile, false).window, 'great day has an outdoor window');
});

test('good weather outranks a bad almanac day', () => {
  const key = '2026-11-15'; // almanac alone: 凶 Take care for this profile
  const plain = buildFortune(profile, new Date(2026, 10, 15));
  const sunny = buildFortune(profile, new Date(2026, 10, 15), { weather: forecast(key) });
  assert.equal(plain.tier.zh, '凶');
  assert.ok(sunny.score > plain.score);
  assert.notEqual(sunny.tier.zh, plain.tier.zh);
  assert.match(sunny.intro, /Clear skies beat old omens/);
  assert.match(sunny.yi[0], /Get outside/); // Sunday: off day
  assert.match(sunny.why.verdict, /lift/);
  assert.ok(sunny.why.outside);
  assert.match(sunny.nature.pentadReality, /poetry/);
});

test('storms lower the reading and favor staying in', () => {
  const f = buildFortune(profile, new Date(2026, 10, 16), { weather: forecast('2026-11-16', { code: 95, rain: 90 }) });
  assert.match(f.yi[0], /home/);
  assert.match(f.ji[0], /trips/);
});

test('southern hemisphere flips the season note', () => {
  const f = buildFortune(profile, new Date(2026, 10, 15), { lat: -33.9 });
  assert.equal(f.nature.localTerm.zh, '立夏');
});
