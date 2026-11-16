// Auspicious — real-life layer: turns a weather forecast into a verdict and advice.
// Pure functions (no network); fed with Open-Meteo forecast JSON.

// WMO weather codes → condition.
export function decodeCode(code) {
  if (code === 0) return { label: 'Clear', kind: 'clear' };
  if (code === 1) return { label: 'Mostly clear', kind: 'clear' };
  if (code === 2) return { label: 'Partly cloudy', kind: 'partly' };
  if (code === 3) return { label: 'Overcast', kind: 'cloudy' };
  if (code === 45 || code === 48) return { label: 'Fog', kind: 'fog' };
  if (code >= 51 && code <= 55) return { label: 'Drizzle', kind: 'rain' };
  if (code === 56 || code === 57) return { label: 'Freezing drizzle', kind: 'ice' };
  if (code >= 61 && code <= 65) return { label: code === 65 ? 'Heavy rain' : 'Rain', kind: 'rain' };
  if (code === 66 || code === 67) return { label: 'Freezing rain', kind: 'ice' };
  if (code >= 71 && code <= 77) return { label: code === 75 ? 'Heavy snow' : 'Snow', kind: 'snow' };
  if (code >= 80 && code <= 82) return { label: code === 82 ? 'Violent showers' : 'Showers', kind: 'rain' };
  if (code === 85 || code === 86) return { label: 'Snow showers', kind: 'snow' };
  if (code >= 95) return { label: code === 95 ? 'Thunderstorms' : 'Thunderstorms with hail', kind: 'storm' };
  return { label: 'Mixed', kind: 'cloudy' };
}

const hourOf = (iso) => Number(iso.slice(11, 13)) + Number(iso.slice(14, 16)) / 60;
const toHour = (hhmm) => Number((hhmm || '0').split(':')[0]);

/** Find the most pleasant 2-hour stretch of daylight, preferring times the user is free. */
function bestWindow(hourly, key, sunrise, sunset, profile, isWorkday) {
  const hours = [];
  hourly.time.forEach((t, i) => {
    if (!t.startsWith(key)) return;
    const h = hourOf(t);
    if (h < Math.max(sunrise + 0.5, 7) || h + 1 > sunset - 0.25) return;
    const temp = hourly.temperature_2m[i];
    const rain = hourly.precipitation_probability?.[i] ?? 0;
    const kind = decodeCode(hourly.weather_code[i]).kind;
    let score = 10 - Math.abs(temp - 20) * 0.35 - rain * 0.08;
    if (kind === 'clear') score += 1.5;
    if (kind === 'partly') score += 0.8;
    if (['rain', 'snow', 'storm', 'ice'].includes(kind)) score -= 6;
    if (isWorkday) {
      const ws = toHour(profile.workStart), we = toHour(profile.workEnd);
      const free = h < ws || h >= we || (h >= 12 && h < 14); // before/after work or lunch
      if (free) score += 1.5;
    }
    hours.push({ h: Math.floor(h), score, temp, rain });
  });
  let best = null;
  for (let i = 0; i + 1 < hours.length; i++) {
    if (hours[i + 1].h !== hours[i].h + 1) continue;
    const s = hours[i].score + hours[i + 1].score;
    if (!best || s > best.s) best = { s, from: hours[i].h, to: hours[i].h + 2, rain: Math.max(hours[i].rain, hours[i + 1].rain) };
  }
  return best && best.s > 10 ? { from: best.from, to: best.to } : null;
}

/**
 * Assess the day's weather for a civil date key (YYYY-MM-DD).
 * Returns null when the forecast doesn't cover that date.
 */
export function assessWeather(data, key, profile = {}, isWorkday = true) {
  if (!data?.daily?.time) return null;
  const i = data.daily.time.indexOf(key);
  if (i < 0) return null;
  const d = data.daily;
  const code = d.weather_code[i];
  const cond = decodeCode(code);
  const tmax = d.temperature_2m_max[i];
  const tmin = d.temperature_2m_min[i];
  const rain = d.precipitation_probability_max?.[i] ?? null;
  const wind = d.wind_speed_10m_max?.[i] ?? 0;
  const uv = d.uv_index_max?.[i] ?? null;
  const sunrise = hourOf(d.sunrise[i]);
  const sunset = hourOf(d.sunset[i]);
  const rainP = rain ?? (cond.kind === 'rain' ? 70 : 10);

  let verdict;
  const reasons = [];
  if (cond.kind === 'storm' || cond.kind === 'ice' || code === 75 || code === 86 || tmax >= 35 || tmax <= -10 || wind >= 50) {
    verdict = 'caution';
    if (cond.kind === 'storm') reasons.push('thunderstorms in the forecast');
    if (cond.kind === 'ice') reasons.push('ice on the roads');
    if (code === 75 || code === 86) reasons.push('heavy snow');
    if (tmax >= 35) reasons.push(`a high of ${Math.round(tmax)}°C`);
    if (tmax <= -10) reasons.push(`a high of only ${Math.round(tmax)}°C`);
    if (wind >= 50) reasons.push(`gusts up to ${Math.round(wind)} km/h`);
  } else if (((cond.kind === 'rain' || cond.kind === 'snow') && rainP >= 40) || rainP >= 60 || tmax <= 2) {
    verdict = 'wet';
    if (cond.kind === 'snow') reasons.push('snow');
    if (rainP >= 40) reasons.push(`a ${Math.round(rainP)}% chance of ${cond.kind === 'snow' ? 'precipitation' : 'rain'}`);
    if (tmax <= 2) reasons.push('near-freezing temperatures');
    if (!reasons.length) reasons.push(cond.label.toLowerCase());
  } else if (cond.kind === 'rain' || cond.kind === 'snow') {
    verdict = 'ok';
    reasons.push(`a little ${cond.label.toLowerCase()} possible`, `a high of ${Math.round(tmax)}°C`);
  } else if (['clear', 'partly'].includes(cond.kind) && rainP < 25 && tmax >= 12 && tmax <= 28 && wind < 30) {
    verdict = 'great';
    reasons.push(`${cond.label.toLowerCase()} skies`, `a mild high of ${Math.round(tmax)}°C`, `only a ${Math.round(rainP)}% chance of rain`);
  } else if (rainP < 35 && tmax >= 8 && tmax <= 31 && wind < 40) {
    verdict = 'fair';
    reasons.push(`${cond.label.toLowerCase()}`, `a high of ${Math.round(tmax)}°C`, 'little chance of rain');
  } else {
    verdict = 'ok';
    reasons.push(`${cond.label.toLowerCase()}`, `a high of ${Math.round(tmax)}°C`);
  }

  const window = ['great', 'fair', 'ok'].includes(verdict) ? bestWindow(data.hourly, key, sunrise, sunset, profile, isWorkday) : null;
  const MOD = { great: 2, fair: 1, ok: 0, wet: 0, caution: -1 };
  return {
    code, cond, tmax, tmin, rain: rainP, wind, uv, sunrise, sunset,
    daylight: Math.round((sunset - sunrise) * 10) / 10,
    verdict, mod: MOD[verdict], reasons, window,
  };
}

export const cToF = (c) => (c * 9) / 5 + 32;
export const fmtTemp = (c, units) => `${Math.round(units === 'f' ? cToF(c) : c)}°`;
export function fmtClock(h) {
  const hh = Math.floor(h), mm = Math.round((h - hh) * 60);
  const m = mm === 60 ? 0 : mm, H = mm === 60 ? hh + 1 : hh;
  return `${H % 12 || 12}:${String(m).padStart(2, '0')} ${H < 12 ? 'am' : 'pm'}`;
}

// ---------- advice ----------

const fmtWin = (w) => {
  const p = (x) => ({ n: x % 12 || 12, m: x < 12 ? 'am' : 'pm' });
  const a = p(w.from), b = p(w.to);
  return a.m === b.m ? `${a.n}–${b.n} ${b.m}` : `${a.n} ${a.m}–${b.n} ${b.m}`;
};
export const fmtWindow = fmtWin;

/** One "Do" item driven by the weather (or null). */
export function weatherDo(real, isWorkday) {
  if (!real) return null;
  const win = real.window ? ` ${fmtWin(real.window)} is the nicest stretch.` : '';
  switch (real.verdict) {
    case 'great': return isWorkday ? `Take a walk or eat lunch outside.${win}` : `Get outside: yard work, a long walk, errands.${win}`;
    case 'fair': return isWorkday ? `Step out for fresh air at lunch.${win}` : `Good weather for outdoor chores.${win}`;
    case 'wet': return isWorkday ? 'Book a long deep-work block while it’s wet out' : 'Pick an indoor project: sort, fix, tidy';
    case 'caution': return isWorkday ? 'Work from home if you can' : 'Stay in and stay safe';
    default: return null;
  }
}

/** One "Skip" item driven by the weather (or null). */
export function weatherSkip(real) {
  if (!real) return null;
  return {
    great: 'Staying glued to your desk all day',
    wet: 'Outdoor plans without a backup',
    caution: 'Non-essential trips',
  }[real.verdict] || null;
}

// Headline when real conditions should lead: [verdict][almanac band].
const LINES = {
  great: {
    good: 'Clear skies and a strong almanac. Go big today.',
    neutral: 'The sky is doing the work today. Get outside.',
    bad: 'Clear skies beat old omens. Step outside, then finish what’s open.',
  },
  fair: {
    good: 'A good day, inside and out.',
    neutral: 'Mild and steady out there. Keep a steady pace in here.',
    bad: 'The almanac frowns; the weather doesn’t. Keep it light.',
  },
  wet: {
    good: 'Rain outside, momentum inside. Ship from your desk.',
    neutral: 'Rain on the windows: perfect for deep work.',
    bad: 'Grey sky, cautious almanac. Stay in and finish things.',
  },
  caution: {
    good: 'Rough weather. Make your big moves from home.',
    neutral: 'Weather first: stay safe and plan around it.',
    bad: 'Warnings in the sky and in the almanac. Lie low today.',
  },
};
export const weatherHeadline = (real, band) => (real && LINES[real.verdict] ? LINES[real.verdict][band] : null);

/** Plain-language "Outside" explanation. */
export function weatherWhy(real, units, almanacBand) {
  if (!real) return null;
  // Temperatures are listed in the parentheses, so drop "a high of …" from the reasons.
  let reasons = real.reasons.filter((r) => !/high of/.test(r));
  if (!reasons.length) reasons = [real.cond.label.toLowerCase()];
  reasons = reasons.map((r) => r.replace(/(-?\d+)°C/g, (_, c) => fmtTemp(Number(c), units)));
  const list = reasons.length > 1 ? `${reasons.slice(0, -1).join(', ')} and ${reasons.at(-1)}` : reasons[0];
  const temps = `${fmtTemp(real.tmax, units)} high, ${fmtTemp(real.tmin, units)} low`;
  const base = `Today brings ${list} (${temps}). Sunset is at ${fmtClock(real.sunset)}, with ${real.daylight} hours of daylight.`;
  const verdictLine = {
    great: almanacBand === 'bad'
      ? ' Real conditions outrank old omens: this is a day to get outside, so the reading is lifted.'
      : ' A genuinely good day to be outside, which lifts the reading.',
    fair: ' Pleasant enough to step out, a small lift to the day.',
    ok: ' Nothing remarkable outside, so the almanac leads today.',
    wet: ' Not a day for outdoor plans, but a good one for focused indoor work.',
    caution: ' Safety comes first, so the reading is lowered and the advice favors staying in.',
  }[real.verdict];
  return base + verdictLine;
}
