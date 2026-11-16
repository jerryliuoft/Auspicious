import { buildFortune, dateKey } from './lib/fortune-engine.js';
import { dayInfo, solarYear, yearStemIndex, yearBranchIndex, STEMS, BRANCHES } from './lib/almanac.js';
import { ELEMENT_INFO } from './lib/content.js';
import { fmtRange } from './lib/explain.js';
import { fmtTemp, fmtClock, fmtWindow } from './lib/weather.js';
import { getWeather } from './lib/weather-fetch.js';
import { getEventsFor } from './lib/calendar-fetch.js';
import { OOO_RE } from './lib/agenda.js';
import { mountShrine } from './shrine.js';

const WX_ICON = {
  clear: '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.5 1.5M17.2 17.2l1.5 1.5M5.3 18.7l1.5-1.5M17.2 6.8l1.5-1.5"/>',
  partly: '<path d="M9 4.5v1.6M4.4 9H6M5.7 5.7l1.1 1.1M13.4 5.7l-1.1 1.1"/><path d="M6.6 11.2a3 3 0 1 1 5.6-1.9"/><path d="M8 19.5h9a3.5 3.5 0 0 0 .3-7 5 5 0 0 0-9.6 1.5A2.8 2.8 0 0 0 8 19.5Z"/>',
  cloudy: '<path d="M7 18.5h10.5a4 4 0 0 0 .4-8 5.5 5.5 0 0 0-10.6 1.6A3.3 3.3 0 0 0 7 18.5Z"/>',
  fog: '<path d="M4 9h16M6 13h12M4 17h16"/>',
  rain: '<path d="M7 15h10.5a4 4 0 0 0 .4-8 5.5 5.5 0 0 0-10.6 1.6A3.3 3.3 0 0 0 7 15Z"/><path d="M9 18l-1 2.5M13 18l-1 2.5M17 18l-1 2.5"/>',
  snow: '<path d="M7 14.5h10.5a4 4 0 0 0 .4-8 5.5 5.5 0 0 0-10.6 1.6A3.3 3.3 0 0 0 7 14.5Z"/><path d="M9 18.5h.01M12.5 20h.01M16 18.5h.01"/>',
  storm: '<path d="M7 14.5h10.5a4 4 0 0 0 .4-8 5.5 5.5 0 0 0-10.6 1.6A3.3 3.3 0 0 0 7 14.5Z"/><path d="m12.5 15.5-2 3.5h3l-2 3.5"/>',
  ice: '<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9"/>',
};
const wxIcon = (kind, cls = 'wx-ico') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${WX_ICON[kind] || WX_ICON.cloudy}</svg>`;
import { local, session, isExtension, DEFAULT_SETTINGS } from './lib/storage.js';
import { flip, tick, chime, impact, reveal, riser, setSoundEnabled } from './lib/sound.js';
import { burst, centerOf, countUp } from './lib/fx.js';
import { luckStats, nextHistory, MILESTONES } from './lib/stats.js';

const $ = (id) => document.getElementById(id);
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SPIRIT_NOTES = {
  天刑: 'Disputes and strict judgment',
  朱雀: 'Gossip and miscommunication',
  白虎: 'Sharp words and accidents',
  天牢: 'Delays and getting stuck',
  玄武: 'Mix-ups and lost files',
  勾陈: 'Red tape and entanglement',
};
const ICON = {
  gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></svg>',
  up: '<svg class="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 5 5L20 7"/></svg>',
  chev: '<svg class="chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>',
};
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const dayOfYear = (d) => Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - new Date(d.getFullYear(), 0, 0)) / 86400000);
const shortDate = (d) => `${MONTHS[d.getMonth()].slice(0, 3)} ${d.getDate()}`;

/** Moon glyph: lit side on the right while waxing, on the left while waning. */
function moonSvg(fraction) {
  const r = 10, cx = 12, top = 2, bottom = 22;
  const waxing = fraction < 0.5;
  const k = Math.cos(2 * Math.PI * fraction); // 1 = new, -1 = full
  const rx = Math.abs(k) * r;
  const crescent = k > 0;
  const edge = waxing ? `A${r},${r} 0 0 1 ${cx},${bottom}` : `A${r},${r} 0 0 0 ${cx},${bottom}`;
  const sweep = waxing ? (crescent ? 0 : 1) : (crescent ? 1 : 0);
  return `<svg class="moon-ico" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="${cx}" cy="12" r="${r}" fill="none" stroke="currentColor" stroke-opacity=".3" stroke-width="1"/>
    <path d="M${cx},${top} ${edge} A${rx.toFixed(2)},${r} 0 0 ${sweep} ${cx},${top}Z" fill="currentColor"/></svg>`;
}
const ordinal = (n) => ['1st', '2nd', '3rd'][n];

// ---------- mode & state ----------
const params = new URLSearchParams(location.search);
const mode = params.get('mode') || 'popup'; // popup | window | tab
document.body.classList.add(`mode-${mode}`);

let auto = params.get('auto') === '1';
if (mode === 'popup') {
  const { autoOpenAt } = await session.get(['autoOpenAt']);
  if (autoOpenAt && Date.now() - autoOpenAt < 10000) auto = true;
  await session.remove(['autoOpenAt']);
}

// ?date=YYYY-MM-DD previews another day (handy while developing).
const now = /^\d{4}-\d{2}-\d{2}$/.test(params.get('date') || '')
  ? (([y, m, d]) => new Date(y, m - 1, d))(params.get('date').split('-').map(Number))
  : new Date();
const today = dateKey(now);
const daysAgo = (n) => { const d = new Date(now); d.setDate(now.getDate() - n); return d; };
const yesterday = daysAgo(1);

const stored = await local.get(['profile', 'settings', 'tornOn', 'remedyChecks', 'history', 'calendar', 'sleep', 'wish']);
let sleepToday = stored.sleep?.date === dateKey(now) ? stored.sleep.q : null;
const history = Array.isArray(stored.history) ? stored.history : [];
const yesterdayKey = (() => { const d = new Date(now); d.setDate(d.getDate() - 1); return dateKey(d); })();
// Streak as it will be once today's page is turned.
const pending = nextHistory(history, today);
const greeting = (() => {
  const h = new Date().getHours();
  return h < 5 ? 'Up late.' : h < 12 ? 'Good morning.' : h < 18 ? 'Good afternoon.' : 'Good evening.';
})();
const settings = { ...DEFAULT_SETTINGS, ...stored.settings };
setSoundEnabled(settings.sound);
if (params.has('reset')) { stored.tornOn = null; await local.remove(['tornOn']); }

const sy = solarYear(now.getFullYear(), now.getMonth() + 1, now.getDate());
const yStem = STEMS[yearStemIndex(sy)], yBranch = BRANCHES[yearBranchIndex(sy)];
const yearName = `${ELEMENT_INFO[yStem.element].name} ${yBranch.animal}`;

function openSettings() {
  if (isExtension && chrome.runtime.openOptionsPage) chrome.runtime.openOptionsPage();
  else location.href = 'settings.html';
}
const masthead = (text, chip = '') => `
  <header class="masthead">
    <span>${text}</span>
    <span class="spacer"></span>${chip}
    <button class="icon-btn" type="button" data-settings aria-label="Settings" title="Settings">${ICON.gear}</button>
  </header>`;
const todayStamp = `${WEEKDAYS[now.getDay()].slice(0, 3)} · ${now.getDate()} ${MONTHS[now.getMonth()].slice(0, 3)} ${now.getFullYear()} · No. ${dayOfYear(now)}`;

// ---------- render ----------
function renderCover(profileReady) {
  const cover = $('cover');
  if (!profileReady) {
    cover.innerHTML = `${masthead(todayStamp)}
      <div class="datestack" aria-hidden="true"><div class="past2">${shortDate(daysAgo(2))}</div><div class="past1">${shortDate(yesterday)}</div><div class="next">${shortDate(now)}</div></div>
      <div class="setup">
        <p>A daily fortune for your workday.</p>
        <button class="btn-primary" type="button" data-settings>Set up your almanac</button>
      </div>`;
    return;
  }
  const info = dayInfo(yesterday.getFullYear(), yesterday.getMonth() + 1, yesterday.getDate());
  cover.innerHTML = `${masthead(`${yearName} year`)}
    <div class="datestack" aria-hidden="true">
      <div class="past2">${shortDate(daysAgo(2))}</div>
      <div class="past1">${shortDate(yesterday)}</div>
      <div class="next">${shortDate(now)}</div>
    </div>
    <p class="yesterday">Yesterday · <span class="han">${info.pillar}</span> · ${info.officer.en} day</p>
    <p class="teaser"><span class="greet">${greeting}</span>${history.length ? `${WEEKDAYS[now.getDay()]}’s fortune is ready.` : 'Your first page is ready.'}
      <span class="sub">${history.includes(yesterdayKey) ? `Turn it to make it ${pending.streak} days in a row.` : 'Your work reading for today, sealed until you turn the page.'}</span></p>
    <div class="turn">
      <button class="turn-btn" id="turnBtn" type="button" aria-label="Press and hold to turn to today's page">
        ${ICON.up}<svg class="ring" viewBox="0 0 70 70" aria-hidden="true"><circle cx="35" cy="35" r="33"></circle></svg>
      </button>
      <span class="turn-hint" id="turnHint">${auto ? 'Turning the page…' : 'Hold to reveal'}</span>
    </div>
    <div class="leak" aria-hidden="true"></div>`;
}

function statsHtml(f, s) {
  const line = s.luck >= 70 ? `Better than ${s.luck}% of your days this year.`
    : s.luck >= 35 ? `A middle-of-the-road day for you: better than ${s.luck}% of your year.`
      : 'A rougher day than most. The quick fixes below help.';
  return `
    <div class="stats rv" id="stats" style="--i:-4">
      <div class="luck" id="luckRing" style="--luck:${s.luck}" role="img" aria-label="Luck ${s.luck} out of 100"><span class="n" id="luckNum">${s.luck}</span><span class="l">Luck</span></div>
      <div class="stats-body">
        <p class="stats-line">${line}</p>
        <div class="badges" id="badges"></div>
      </div>
    </div>`;
}

const wishBadge = (text) => ({ cls: 'wish', html: `<b>Wish blessed</b> · ${esc(text.length > 26 ? `${text.slice(0, 25)}…` : text || 'your wish')}` });

function badgeList(f, s, streak, total) {
  const out = [];
  if (stored.wish?.date === today && stored.wish.confirmed) out.push(wishBadge(stored.wish.text));
  if (f.tier.band === 'good' && s.rare) out.push({ cls: 'rare', html: `<b>Rare</b> · about 1 in ${s.oneIn} days` });
  if (total === 1) out.push({ cls: 'milestone', html: '<b>First page</b> · welcome' });
  else if (MILESTONES.includes(streak)) out.push({ cls: 'milestone', html: `<b>${streak}-day streak</b> · milestone` });
  else if (streak >= 2) out.push({ cls: 'streak', html: `<b>${streak}-day</b> streak` });
  return out;
}

const badgeHtml = (b) => `<span class="badge ${b.cls}">${b.html}</span>`;

const clockShort = (h) => fmtClock(h).replace(':00', '');
const QUALITY_LABEL = { best: 'Best hour', good: 'Clear hour', careful: 'Careful hour' };

/** "Your day": calendar insights and a timeline of today's meetings. */
function agendaHtml(f, i) {
  const a = f.agenda;
  if (!a) {
    if (stored.calendar?.url) return '';
    return `<button class="connect-cal rv" style="--i:${i}" type="button" data-settings>
      <span class="plus" aria-hidden="true">+</span><span><b>Connect your calendar</b>
      <small>See how today's meetings line up with its good and careful hours.</small></span></button>`;
  }
  const sum = a.ooo ? 'Out of office'
    : a.count ? `${a.count} meeting${a.count === 1 ? '' : 's'} · ${a.meetingHours} h · ${{ light: 'Light', moderate: 'Moderate', heavy: 'Heavy' }[a.load]} day`
      : 'No meetings';
  const rows = [];
  let focusShown = !a.focus;
  for (const it of a.items) {
    if (!focusShown && a.focus.from <= it.from) {
      rows.push(focusRow(a.focus));
      focusShown = true;
    }
    rows.push(`<li class="ev${it.tone ? ` tone-${it.tone}` : ''}">
      <span class="t">${clockShort(it.from)}${it.energy != null ? `<i class="eb${it.energy < 40 ? ' low' : ''}" style="--e:${it.energy}" title="Energy ≈${it.energy}"><b></b></i>` : ''}</span>
      <div class="b"><b>${esc(it.title)}</b>${it.note ? `<small>${esc(it.note)}</small>` : ''}</div>
      ${it.quality ? `<span class="q q-${it.quality}">${QUALITY_LABEL[it.quality]}</span>` : ''}
    </li>`);
  }
  if (!focusShown) rows.push(focusRow(a.focus));
  return `
    <section class="agenda rv" id="agenda" style="--i:${i}" aria-labelledby="agendaTitle">
      <h2 class="sec-head" id="agendaTitle"><span>Your day</span><span class="line"></span></h2>
      <p class="agenda-sum">${sum}${a.allDay.filter((t) => !a.ooo || !OOO_RE.test(t)).map((t) => ` · ${esc(t)}`).join("")}</p>
      ${a.insights.length ? `<ul class="insights">${a.insights.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
      ${rows.length ? `<ol class="timeline">${rows.join('')}</ol>` : ''}
    </section>`;
}

const focusRow = (fb) => `<li class="ev focus"><span class="t">${clockShort(fb.from)}</span>
  <div class="b"><b>Focus block</b><small>${clockShort(fb.from)}–${clockShort(fb.to)}, free for deep work</small></div></li>`;

function row(label, html, i) {
  return `<div class="row rv" style="--i:${i}"><dt>${label}</dt><dd>${html}</dd></div>`;
}

const BOLT = '<svg class="bolt" viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 4.5 13.5H11L10 22l8.5-11.5H12L13 2Z" fill="currentColor"/></svg>';

/** Current local hour if we're looking at today, else null. */
function nowHour() {
  const real = new Date();
  if (dateKey(real) !== today) return null;
  return real.getHours() + real.getMinutes() / 60;
}

function energyChart(f) {
  const E = f.energy, W = 352, H = 104, top = 8, base = H - 22;
  const x = (h) => ((h - E.wake) / (E.bed - E.wake)) * W;
  // Fit the scale to the day so the shape reads clearly (floor 10 below the lowest point).
  const lo = Math.max(0, Math.min(...E.points.map((p) => p.e)) - 10), hi = Math.min(100, Math.max(...E.points.map((p) => p.e)) + 8);
  const y = (e) => base - ((e - lo) / (hi - lo)) * (base - top);
  const pts = E.points;
  const line = pts.map((p, k) => `${k ? 'L' : 'M'}${x(p.h).toFixed(1)},${y(p.e).toFixed(1)}`).join('');
  const area = `${line}L${x(pts.at(-1).h).toFixed(1)},${base}L${x(pts[0].h).toFixed(1)},${base}Z`;
  const ws = Number((stored.profile.workStart || '09:00').split(':')[0]);
  const we = Number((stored.profile.workEnd || '18:00').split(':')[0]);
  const ticks = [];
  for (let h = Math.ceil(E.wake / 3) * 3; h <= E.bed; h += 3) {
    ticks.push(`<text x="${x(h).toFixed(1)}" y="${H - 6}" text-anchor="middle">${h % 12 || 12}${(h % 24) < 12 ? 'a' : 'p'}</text>`);
  }
  const bars = (f.agenda?.items || []).map((it) => `<rect class="mt" x="${x(it.from).toFixed(1)}" y="${base + 3}" width="${Math.max(2, x(it.to) - x(it.from)).toFixed(1)}" height="4" rx="1"/>`).join('');
  const mark = (w, label, cls) => {
    if (!w) return '';
    const cx = x((w.from + w.to) / 2), cy = y(w.e);
    return `<g class="${cls}"><circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="3.5"/><text x="${cx.toFixed(1)}" y="${(cy - 8).toFixed(1)}" text-anchor="middle">${label} ${w.e}</text></g>`;
  };
  const nh = nowHour();
  let now = '';
  if (nh != null && nh >= E.wake && nh <= E.bed) {
    const e = pts.reduce((a, p) => (Math.abs(p.h - nh) < Math.abs(a.h - nh) ? p : a)).e;
    now = `<g class="now"><line x1="${x(nh).toFixed(1)}" x2="${x(nh).toFixed(1)}" y1="${top}" y2="${base}"/><circle cx="${x(nh).toFixed(1)}" cy="${y(e).toFixed(1)}" r="4.5"/></g>`;
  }
  return `<svg class="echart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Energy forecast: peaks ${f.energy.peak?.e ?? ''}, dips ${f.energy.dip?.e ?? ''}">
    <rect class="work" x="${x(ws).toFixed(1)}" y="${top}" width="${(x(we) - x(ws)).toFixed(1)}" height="${base - top}"/>
    <path class="area" d="${area}"/><path class="line" d="${line}"/>
    ${bars}${mark(E.peak, 'Peak', 'pk')}${mark(E.dip, 'Dip', 'dp')}${now}
    <g class="ticks">${ticks.join('')}</g></svg>`;
}

function energyHtml(f, i) {
  const E = f.energy;
  const nh = nowHour();
  const nowE = nh != null && nh >= E.wake && nh <= E.bed ? E.points.reduce((a, p) => (Math.abs(p.h - nh) < Math.abs(a.h - nh) ? p : a)).e : null;
  const SLEEP = { great: 'Great', ok: 'Okay', poor: 'Rough' };
  const check = sleepToday
    ? `<p class="sleep-done">Slept: <b>${SLEEP[sleepToday]}</b> <button type="button" class="linkish" data-sleep-change>Change</button></p>`
    : `<div class="sleep-ask"><span>How did you sleep?</span>${Object.entries(SLEEP).map(([k, v]) => `<button type="button" class="chip" data-sleep="${k}">${v}</button>`).join('')}</div>`;
  return `
    <section class="energy rv" id="energy" style="--i:${i}" aria-labelledby="energyTitle">
      <h2 class="sec-head" id="energyTitle"><span>Your energy</span><span class="line"></span>${nowE != null ? `<span class="now-chip">${BOLT}${nowE} now</span>` : ''}</h2>
      ${check}
      ${energyChart(f)}
      <ul class="insights">${E.notes.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
      <p class="fine">An estimate from your body clock, sleep, and calendar, not a medical measurement.</p>
    </section>`;
}

function renderToday(f, profile, stats) {
  document.body.classList.remove('band-good', 'band-neutral', 'band-bad');
  document.body.classList.add(`band-${f.tier.band}`);
  const t = $('today');
  const best = f.hours.best, caution = f.hours.caution;
  const items = f.remedyMode ? f.remedies : f.boosts;
  const chars = [...f.tier.zh];
  const tierHtml = chars.map((c, k) => `<span class="ch${k === chars.length - 1 ? ' hl' : ''}" style="--k:${k}"><span class="mask"><span class="g">${c}</span></span></span>`).join('');
  const real = f.real, u = f.units;
  let i = 0;
  const rows = [
    real ? row('Weather', `<span class="wx-line">${wxIcon(real.cond.kind)}${esc(real.cond.label)} · ${fmtTemp(real.tmax, u)} / ${fmtTemp(real.tmin, u)}</span>
      <small>${Math.round(real.rain)}% chance of rain · Sunset ${fmtClock(real.sunset)}${real.window ? ` · Best outside ${fmtWindow(real.window)}` : ''}</small>`, i++) : '',
    best ? row('Best hours', `${fmtRange(best.from, best.to)}${f.hours.bestOutside ? '<small>Outside your work hours</small>' : ''}`, i++) : '',
    caution ? row('Careful', `${fmtRange(caution.from, caution.to)}<small>${SPIRIT_NOTES[caution.spirit.zh] || 'Friction'}</small>`, i++) : '',
    row('Color', `<i class="dotc" style="background:${f.lucky.info.swatch}"></i>${esc(cap(f.lucky.color))}`, i++),
    row('Face', `${f.lucky.direction}${profile.desk ? `<small>${esc(f.lucky.deskNote)}</small>` : '<small>For important calls</small>'}`, i++),
    row('Keep near', esc(cap(f.lucky.item)), i++),
    f.focusLine ? row('Your focus', esc(f.focusLine), i++) : '',
  ].join('');

  t.innerHTML = `
    <div class="rv" style="--i:-12">${masthead(todayStamp, real ? `<span class="wx-chip" title="${esc(real.cond.label)}">${wxIcon(real.cond.kind)}${fmtTemp(real.tmax, u)}</span>` : '')}</div>
    <section class="hero">
      <div class="ghost" aria-hidden="true">${now.getDate()}</div>
      <div class="label rv" style="--i:-12"><span class="line"></span><span>${esc(f.tier.en)}</span></div>
      <div class="tierline">
        <h1 class="tier-zh${chars.length === 1 ? ' one' : ''}" aria-label="${esc(f.tier.en)}">${tierHtml}</h1>
        <div class="vert rv" style="--i:-10" aria-hidden="true">${f.day.pillar}日 · ${f.day.officer.zh}</div>
      </div>
      <p class="fortune"><span>${esc(f.intro)}</span></p>
      ${statsHtml(f, stats)}
      <button class="whyhook rv" style="--i:-3" type="button" id="whyHook"><span class="k">Why</span><span class="t">${esc(f.why.hook)}</span>${ICON.chev}</button>
      <p class="micro rv" style="--i:-2" id="micro"><b>${esc(f.theme.title)}</b> · ${esc(f.theme.text)}</p>
      ${f.isWorkday ? '' : '<p class="offday rv" style="--i:-1">Day off. This reading carries into your next workday.</p>'}
    </section>
    <div class="doskip rv" style="--i:${i++}">
      <div><div class="kicker"><span class="han">宜</span>Do</div><ul>${f.yi.map((s, k) => `<li>${esc(s)}${f.yiEnergy?.[k] ? `<small class="en">${BOLT}${esc(f.yiEnergy[k])}</small>` : ''}</li>`).join('')}</ul></div>
      <div><div class="kicker"><span class="han">忌</span>Skip</div><ul class="skip">${f.ji.map((s) => `<li>${esc(s)}</li>`).join('')}</ul></div>
    </div>
    ${energyHtml(f, i++)}
    ${agendaHtml(f, i++)}
    <section class="why rv" id="why" style="--i:${i++}" aria-labelledby="whyTitle">
      <h2 class="sec-head" id="whyTitle"><span>Why today</span><span class="line"></span></h2>
      ${f.why.verdict ? `<div class="wb verdict"><div class="wl">The verdict</div><p>${esc(f.why.verdict)}</p></div>` : ''}
      ${f.why.outside ? `<div class="wb"><div class="wl">Outside</div><p>${esc(f.why.outside)}</p></div>` : ''}
      <div class="wb"><div class="wl">The calendar</div><p>${esc(f.why.calendar)}</p></div>
      <div class="wb"><div class="wl">You</div><p>${esc(f.why.you)}</p></div>
      ${f.why.hour ? `<div class="wb"><div class="wl">The hour</div><p>${esc(f.why.hour)}</p></div>` : ''}
      <div class="wb nature">
        <div class="wl">Nature</div>
        <div>
          <p class="season"><span class="han">${f.nature.term.zh}</span> ${esc(f.nature.term.en)} · since ${MONTHS[f.nature.termStart.m - 1].slice(0, 3)} ${f.nature.termStart.d} · ${ordinal(f.nature.pentadInTerm)} of 3 microseasons</p>
          <p class="pentad"><span class="pz">${f.nature.pentad.zh}</span><span class="pe">${esc(f.nature.pentad.en)}</span></p>
          <p>${esc(f.nature.pentad.note)}</p>
          ${f.nature.pentadReality ? `<p class="reality">${esc(f.nature.pentadReality)}</p>` : ''}
          <p class="moon">${moonSvg(f.nature.moon.fraction)}<span><b>${f.nature.moon.name}</b>, ${f.nature.moon.illumination}% lit. ${esc(f.nature.moon.note)}</span></p>
        </div>
      </div>
      <figure class="quote">
        <div class="qz">${f.quote.zh}</div>
        <blockquote>${esc(f.quote.en)}</blockquote>
        <figcaption>${esc(f.quote.src)}</figcaption>
        <p class="apply"><span class="k">Today</span>${esc(f.quote.apply)}</p>
      </figure>
    </section>
    <dl class="facts">${rows}</dl>
    <section class="fixes rv" id="fixes" style="--i:${i++}">
      <button class="fixes-toggle" id="fixesBtn" type="button" aria-expanded="false" aria-controls="fixList">
        <span class="mark" aria-hidden="true">${f.remedyMode ? '化' : '运'}</span>
        <span><b>${f.remedyMode ? 'Quick fixes' : 'Make the most of it'}</b>
          <small>${f.remedyMode ? `${items.length} small ways to soften today` : `${items.length} ways to ride a good day`}</small></span>
        ${ICON.chev}
      </button>
      <ol class="fix-list" id="fixList" hidden></ol>
    </section>
    <footer class="colophon rv" style="--i:${i++}">
      ${f.day.officer.en} day · Clashes with ${f.day.clashAnimal} · ${esc(f.nature.term.en)}<br>
      You: ${f.user.animal.animal} · ${f.user.dayMasterInfo.name} · ${yearName} year
    </footer>`;

  wireFixes(f, items);
  wireSleep();
  $('whyHook').addEventListener('click', () => {
    pin();
    $('why').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

function wireFixes(f, items) {
  const saved = stored.remedyChecks && stored.remedyChecks.date === f.dateKey ? stored.remedyChecks.checks : [];
  const list = $('fixList');
  const btn = $('fixesBtn');
  const allDone = () => items.length > 0 && items.every((_, k) => saved[k]);
  const markHealed = () => {
    if ($('micro').querySelector('.healed')) return;
    $('micro').insertAdjacentHTML('beforeend', `<span class="healed">${f.remedyMode ? 'Softened' : 'Amplified'}</span>`);
  };
  if (allDone()) markHealed();

  const renderList = () => {
    list.innerHTML = items.map((txt, k) => `<li style="--i:${k}"><label>
      <input type="checkbox" data-k="${k}" ${saved[k] ? 'checked' : ''}><span class="box">${ICON.check}</span>
      <span class="txt">${esc(txt)}</span></label></li>`).join('');
    list.addEventListener('change', async (e) => {
      saved[Number(e.target.dataset.k)] = e.target.checked;
      if (e.target.checked) {
        const doneCount = items.filter((_, k) => saved[k]).length;
        tick(1 + doneCount * 0.18); // each check rings a little higher
        const box = e.target.nextElementSibling;
        const { x, y } = centerOf(box, $('card'));
        burst($('card'), x, y, { kind: 'sparkle', count: 14, colors: accentColors() });
      }
      await local.set({ remedyChecks: { date: f.dateKey, checks: saved } });
      const msg = list.querySelector('.balanced');
      if (allDone() && !msg) {
        chime();
        const { x, y } = centerOf($('fixesBtn'), $('card'));
        burst($('card'), x, y, { kind: 'confetti', count: 40, colors: accentColors() });
        list.insertAdjacentHTML('beforeend', `<li class="balanced" style="opacity:1">${f.remedyMode ? 'Done. The day’s edge is softened.' : 'Done. Go make it count.'}</li>`);
        markHealed();
      } else if (!allDone() && msg) msg.remove();
    });
  };

  btn.addEventListener('click', () => {
    pin();
    const opening = list.hidden;
    if (opening && !list.childElementCount) renderList();
    list.hidden = !opening;
    btn.setAttribute('aria-expanded', String(opening));
    $('fixes').classList.toggle('open', opening);
    if (opening) setTimeout(() => list.lastElementChild?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 120);
  });
}

// ---------- sleep check-in ----------
let buildOpts = null;
function wireSleep() {
  for (const b of document.querySelectorAll('[data-sleep]')) {
    b.addEventListener('click', async () => {
      pin();
      sleepToday = b.dataset.sleep;
      await local.set({ sleep: { date: today, q: sleepToday } });
      tick(1.2);
      fortune = buildFortune(stored.profile, now, { ...buildOpts, sleep: sleepToday });
      renderToday(fortune, { ...stored.profile }, stats);
      $('today').classList.remove('revealed');
      $('today').classList.add('static');
      choreograph({ animate: false });
      const sec = $('energy');
      sec.classList.add('refreshed');
      sec.scrollIntoView({ block: 'nearest' });
    });
  }
  document.querySelector('[data-sleep-change]')?.addEventListener('click', () => {
    pin();
    sleepToday = null;
    const sec = $('energy');
    sec.querySelector('.sleep-done').outerHTML = `<div class="sleep-ask"><span>How did you sleep?</span>${[['great', 'Great'], ['ok', 'Okay'], ['poor', 'Rough']].map(([k, v]) => `<button type="button" class="chip" data-sleep="${k}">${v}</button>`).join('')}</div>`;
    wireSleep();
  });
}

// ---------- reveal choreography ----------
let fortune = null, stats = null;

function accentColors() {
  const cs = getComputedStyle(document.body);
  const accent = cs.getPropertyValue('--accent').trim() || '#b4232a';
  const ink = cs.getPropertyValue('--ink').trim() || '#18181a';
  return fortune?.tier.band === 'bad' ? [accent, ink] : [accent, '#d9b44a', ink];
}

/** Play the reward beats once the hero is on screen. Timings follow the CSS reveal. */
function choreograph({ animate }) {
  const card = $('card');
  const band = fortune.tier.band;
  const streakNow = nextHistory(history, today);
  const badges = badgeList(fortune, stats, streakNow.streak, streakNow.total);

  if (!animate) {
    $('badges').innerHTML = badges.map(badgeHtml).join('');
    return;
  }
  const at = (ms, fn) => setTimeout(fn, ms);
  $('luckNum').textContent = '0';
  $('luckRing').style.setProperty('--luck', '0');

  // 1. The seal block lands: impact, a nudge of the card, a burst sized to the day.
  at(860, () => {
    impact();
    reveal(band);
    const row = document.querySelector('.tierline');
    row.classList.add('impact');
    setTimeout(() => row.classList.remove('impact'), 420);
    const hl = document.querySelector('.tier-zh .ch.hl') || document.querySelector('.tier-zh');
    const { x, y } = centerOf(hl, card);
    const kind = band === 'good' ? 'confetti' : band === 'neutral' ? 'sparkle' : 'ink';
    const count = band === 'good' ? { 大吉: 90, 吉: 60, 小吉: 34 }[fortune.tier.zh] : undefined;
    burst(card, x, y, { kind, count, colors: accentColors() });
  });

  // 2. Luck counts up with rising ticks.
  at(1250, async () => {
    const el = $('luckNum');
    el.parentElement.classList.add('counting');
    let lastTick = -10;
    await countUp(stats.luck, {
      duration: 300 + stats.luck * 9,
      onStep: (v) => {
        el.textContent = String(v);
        $('luckRing').style.setProperty('--luck', String(v));
        if (v - lastTick >= 4) { lastTick = v; tick(0.8 + v / 140); }
      },
    });
    el.parentElement.classList.remove('counting');
    el.parentElement.classList.add('landed');
    if (stats.luck >= 80) {
      const { x, y } = centerOf(el, card);
      burst(card, x, y, { kind: 'sparkle', count: 18, colors: accentColors() });
    }

    // 3. Badges pop in one by one.
    badges.forEach((b, k) => at(140 + k * 260, () => {
      $('badges').insertAdjacentHTML('beforeend', badgeHtml(b));
      const node = $('badges').lastElementChild;
      if (b.cls === 'rare' || b.cls === 'milestone') {
        chime();
        const { x, y } = centerOf(node, card);
        burst(card, x, y, { kind: b.cls === 'milestone' ? 'confetti' : 'sparkle', count: b.cls === 'milestone' ? 50 : 20, colors: accentColors() });
      } else tick(1.3);
    }));
  });
}

// ---------- turning the page ----------
let turned = false;
async function turn() {
  if (turned) return;
  turned = true;
  const cover = $('cover');
  cover.classList.remove('holding', 'tense');
  cover.classList.add('turning');
  flip();
  $('today').classList.add('revealed');
  choreograph({ animate: true });
  setTimeout(() => cover.remove(), 720);
  setTimeout(() => $('card').classList.add('page-open'), 2600);
  await local.set({ tornOn: today, history: nextHistory(history, today).history });
  if (auto) setTimeout(startCountdown, 3200);
}

function wireHold() {
  const cover = $('cover');
  const btn = $('turnBtn');
  if (!btn) return;
  const hint = $('turnHint');
  const HOLD_MS = 900;
  let ticker = 0, start = 0, holdTimer = 0, rise = null;
  const setPull = (v) => cover.style.setProperty('--pull', v.toFixed(3));
  // A 16 ms ticker drives the visuals and sound; the timeout is the source of truth for completing the turn.
  const step = () => {
    const p = Math.min(1, (performance.now() - start) / HOLD_MS);
    const eased = p * p * (3 - 2 * p);
    setPull(eased);
    rise?.set(p);
    hint.textContent = p < 0.35 ? 'Hold to reveal' : p < 0.75 ? 'Keep holding…' : 'Almost…';
    cover.classList.toggle('tense', p > 0.7);
    if (p >= 1 || turned) clearInterval(ticker);
  };
  const down = (e) => {
    if (turned || (e.type === 'keydown' && e.key !== ' ' && e.key !== 'Enter') || e.repeat) return;
    e.preventDefault();
    cover.classList.remove('springback');
    cover.classList.add('holding');
    start = performance.now();
    rise = riser();
    clearInterval(ticker);
    ticker = setInterval(step, 16); // timer, not rAF: keeps feedback alive even if frames are throttled
    holdTimer = setTimeout(() => { rise?.stop(); turn(); }, HOLD_MS);
  };
  const up = () => {
    if (turned) return;
    clearTimeout(holdTimer);
    clearInterval(ticker);
    rise?.stop();
    rise = null;
    const wasHolding = cover.classList.contains('holding');
    cover.classList.remove('holding', 'tense');
    setPull(0);
    hint.textContent = 'Hold to reveal';
    if (wasHolding) {
      cover.classList.add('springback');
      tick(0.6);
    }
  };
  btn.addEventListener('pointerdown', down);
  btn.addEventListener('keydown', down);
  for (const ev of ['pointerup', 'pointerleave', 'pointercancel', 'keyup', 'blur']) btn.addEventListener(ev, up);
}

// ---------- auto-close countdown ----------
let pinned = false, paused = false;

function pin() {
  if (pinned) return;
  pinned = true;
  $('autoclose').classList.add('pinned');
}

function startCountdown() {
  if (pinned || mode === 'tab') return;
  const bar = $('autoclose');
  const label = $('autocloseLabel');
  bar.hidden = false;
  const stage = $('stage');
  stage.addEventListener('mouseenter', () => { paused = true; });
  stage.addEventListener('mouseleave', () => { paused = false; });
  stage.addEventListener('pointerdown', pin);
  document.addEventListener('keydown', pin);
  if (stage.matches(':hover')) paused = true;
  const total = settings.displaySeconds * 1000;
  let remaining = total, last = performance.now();
  // Wall-clock interval (not rAF) so the timer can't stall if frames are throttled.
  const timer = setInterval(() => {
    const t = performance.now();
    if (pinned) { clearInterval(timer); return; }
    if (!paused) remaining -= t - last;
    last = t;
    $('autocloseFill').style.transform = `scaleX(${Math.max(0, remaining / total).toFixed(4)})`;
    label.textContent = paused ? 'Paused · click to keep open' : `Closing in ${Math.max(1, Math.ceil(remaining / 1000))}s · hover to pause`;
    if (remaining <= 0) { clearInterval(timer); closeSelf(); }
  }, 50);
}

async function closeSelf() {
  $('stage').classList.add('leaving');
  await new Promise((r) => setTimeout(r, 360));
  if (mode === 'window' && isExtension && chrome.windows) {
    const w = await chrome.windows.getCurrent();
    chrome.windows.remove(w.id);
  } else {
    window.close();
  }
}

// ---------- boot ----------
document.addEventListener('click', (e) => { if (e.target.closest('[data-settings]')) openSettings(); });

const profile = stored.profile;
const ready = !!(profile && profile.birthDate);
const turnedToday = stored.tornOn === today;
if (!ready || !turnedToday) renderCover(ready);
if (ready) {
  // Real conditions first: fetch (or reuse cached) local weather before building the page.
  const [weather, events] = await Promise.all([
    profile.location ? getWeather(profile.location, { timeoutMs: 2500 }) : null,
    getEventsFor(now, { timeoutMs: 2500 }),
  ]);
  buildOpts = { weather, events, units: settings.units || 'c', lat: profile.location?.lat };
  fortune = buildFortune(profile, now, { ...buildOpts, sleep: sleepToday || 'ok' });
  stats = luckStats(profile, now, fortune);
  renderToday(fortune, { ...profile }, stats);
  const shrine = mountShrine({
    card: $('card'), local, today,
    getLuck: () => stats.luck,
    getColors: accentColors,
    pin,
    onConfirmed: (text) => {
      stored.wish = { date: today, text, confirmed: true };
      const box = $('badges');
      if (box && !box.querySelector('.badge.wish')) box.insertAdjacentHTML('afterbegin', badgeHtml(wishBadge(text)));
    },
  });
  if (params.get('demo') === 'shrine') setTimeout(() => shrine.demo(params.get('wish') || 'A great card pull'), 400);
  if (turnedToday) {
    $('card').classList.add('page-open');
    $('cover').remove();
    $('today').classList.add('static');
    choreograph({ animate: false });
    if (auto) startCountdown();
  } else {
    wireHold();
    if (auto) setTimeout(turn, 1100);
  }
}
