import { ROLES, FOCUSES, DIRECTIONS, ELEMENT_INFO } from './lib/content.js';
import { BRANCHES, natalChart } from './lib/almanac.js';
import { DEFAULT_PROFILE } from './lib/fortune-engine.js';
import { local, DEFAULT_SETTINGS } from './lib/storage.js';
import { searchCity } from './lib/weather-fetch.js';
import { CHRONOTYPES } from './lib/energy.js';
import { eventsOn } from './lib/ics.js';
import {
  normalizeIcsUrl, requestCalendarPermission, releaseCalendarPermission, loadCalendar,
} from './lib/calendar-fetch.js';

const $ = (id) => document.getElementById(id);
const ROLE_EMOJI = { engineer: '💻', sales: '🤝', manager: '🧭', creative: '🎨', founder: '🚀', ops: '🛠️', student: '📚', general: '✨' };
const TONES = {
  traditional: ['Traditional', 'Classic almanac voice'],
  playful: ['Playful', 'Light, a little cheeky'],
  direct: ['Straight talk', 'Short and to the point'],
};
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function radioTiles(container, name, entries, render) {
  container.innerHTML = '';
  for (const [value, data] of entries) {
    const label = document.createElement('label');
    const input = Object.assign(document.createElement('input'), { type: 'radio', name, value });
    label.append(input);
    label.insertAdjacentHTML('beforeend', render(value, data));
    container.append(label);
  }
}

radioTiles($('roleTiles'), 'role', Object.entries(ROLES), (v, text) => `<span class="emoji">${ROLE_EMOJI[v]}</span><span>${text}</span>`);
radioTiles($('toneTiles'), 'tone', Object.entries(TONES), (v, [t, s]) => `<span>${t}</span><small>${s}</small>`);
const CHRONO_HINT = { lark: 'Sharp early, fades by evening', neutral: 'Peaks late morning', owl: 'Slow start, strong later' };
radioTiles($('chronoTiles'), 'chronotype', Object.entries(CHRONOTYPES), (v, c) => `<span>${c.label}</span><small>${CHRONO_HINT[v]}</small>`);
const fmtWake = (h) => `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.round((h % 1) * 60)).padStart(2, '0')}`;
$('chronoTiles').addEventListener('change', (e) => { $('wakeTime').placeholder = fmtWake(CHRONOTYPES[e.target.value].wake); });
DAYS.forEach((d, i) => {
  const label = document.createElement('label');
  label.innerHTML = `<input type="checkbox" value="${i}">${d}`;
  $('dayChips').append(label);
});
for (const [v, t] of Object.entries(FOCUSES)) $('focus').add(new Option(t, v));
for (const d of DIRECTIONS) $('desk').add(new Option(d, d));

function updateChartPreview() {
  const v = $('birthDate').value;
  const box = $('chartPreview');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) { box.hidden = true; return; }
  const c = natalChart(v, $('birthTime').value || null);
  const animal = BRANCHES[c.yearBranch];
  const el = ELEMENT_INFO[c.dayMaster];
  box.innerHTML = `<span><b>${animal.zh}</b>${animal.emoji} ${animal.animal}</span>
    <span><b>${el.zh}</b>${el.name} day master</span>
    <span>Clashes with the ${BRANCHES[(c.yearBranch + 6) % 12].animal}</span>`;
  box.hidden = false;
}

function fill(profile, settings) {
  $('birthDate').value = profile.birthDate || '';
  $('birthTime').value = profile.birthTime || '';
  $('workStart').value = profile.workStart;
  $('workEnd').value = profile.workEnd;
  $('focus').value = profile.focus;
  $('desk').value = profile.desk || '';
  document.querySelector(`input[name="role"][value="${profile.role}"]`).checked = true;
  document.querySelector(`input[name="tone"][value="${profile.tone}"]`).checked = true;
  const chrono = CHRONOTYPES[profile.chronotype] ? profile.chronotype : 'neutral';
  document.querySelector(`input[name="chronotype"][value="${chrono}"]`).checked = true;
  $('wakeTime').value = profile.wakeTime || '';
  $('wakeTime').placeholder = fmtWake(CHRONOTYPES[chrono].wake);
  for (const cb of $('dayChips').querySelectorAll('input')) cb.checked = profile.workDays.includes(Number(cb.value));
  $('autoShow').checked = settings.autoShow;
  $('displaySeconds').value = settings.displaySeconds;
  $('secondsOut').textContent = settings.displaySeconds;
  $('sound').checked = settings.sound;
  $('units').value = settings.units || (/^en-(US|LR|MM)$/i.test(navigator.language) ? 'f' : 'c');
  location_ = profile.location || null;
  showLocation();
  updateChartPreview();
}

// ---------- location ----------
let location_ = null;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const placeName = (p) => [p.name, p.admin1, p.country].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(', ');

function showLocation() {
  const status = $('cityStatus');
  if (location_) {
    status.innerHTML = `Using weather for <b>${esc(placeName(location_))}</b>. <button type="button" class="linkish" id="cityClear">Remove</button>`;
    $('cityClear').addEventListener('click', () => { location_ = null; showLocation(); });
  } else {
    status.textContent = 'No city set. Your page will follow the almanac only.';
  }
}

async function runCitySearch() {
  const q = $('cityInput').value;
  const box = $('cityResults');
  box.innerHTML = '';
  if (q.trim().length < 2) { $('cityStatus').textContent = 'Type at least two letters of your city.'; return; }
  $('cityStatus').textContent = 'Searching…';
  try {
    const results = await searchCity(q);
    if (!results.length) { $('cityStatus').textContent = `No places found for “${q.trim()}”. Try a nearby larger city.`; return; }
    $('cityStatus').textContent = 'Pick your city:';
    for (const r of results) {
      const b = document.createElement('button');
      b.type = 'button';
      b.innerHTML = `<span>${esc(placeName(r))}</span><small>${r.lat.toFixed(2)}, ${r.lon.toFixed(2)}</small>`;
      b.addEventListener('click', () => {
        location_ = r;
        box.innerHTML = '';
        $('cityInput').value = '';
        showLocation();
      });
      box.append(b);
    }
  } catch {
    $('cityStatus').textContent = 'Couldn’t reach the weather service. Check your connection and try again.';
  }
}
// ---------- calendar ----------
const maskUrl = (u) => { try { const x = new URL(u); return `${x.host}/…${x.pathname.slice(-12)}`; } catch { return 'your calendar'; } };

async function showCalendar() {
  const { calendar } = await local.get(['calendar']);
  const status = $('icsStatus');
  if (calendar?.url) {
    status.innerHTML = `Connected to <b>${esc(maskUrl(calendar.url))}</b>${calendar.summary ? ` · ${esc(calendar.summary)}` : ''}. <button type="button" class="linkish" id="icsRemove">Disconnect</button>`;
    $('icsRemove').addEventListener('click', async () => {
      await releaseCalendarPermission(calendar.url);
      await local.remove(['calendar', 'calCache']);
      showCalendar();
    });
  } else {
    status.textContent = 'Not connected. Your page will not include meeting insights.';
  }
}

$('icsConnect').addEventListener('click', () => {
  const status = $('icsStatus');
  let url;
  try { url = normalizeIcsUrl($('icsInput').value); } catch {
    status.textContent = 'That doesn’t look like a calendar link. Paste the full https:// or webcal:// address.';
    $('icsInput').focus();
    return;
  }
  // Ask for permission first, straight from the click (Chrome needs the user gesture).
  requestCalendarPermission(url).then(async (granted) => {
    if (!granted) { status.textContent = 'Permission wasn’t granted, so the calendar can’t be read. Try again and choose Allow.'; return; }
    status.textContent = 'Reading your calendar…';
    try {
      const records = await loadCalendar(url);
      const today = new Date();
      let week = 0;
      for (let i = 0; i < 7; i++) week += eventsOn(records, new Date(today.getFullYear(), today.getMonth(), today.getDate() + i)).filter((e) => !e.allDay).length;
      const todayCount = eventsOn(records, today).filter((e) => !e.allDay).length;
      const summary = `${todayCount} meeting${todayCount === 1 ? '' : 's'} today, ${week} this week`;
      await local.set({ calendar: { url, connectedAt: Date.now(), summary } });
      await local.remove(['calCache']);
      $('icsInput').value = '';
      showCalendar();
    } catch {
      status.textContent = 'Couldn’t read that calendar. Check that the link is the private iCal/ICS address and try again.';
    }
  });
});
showCalendar();

$('citySearch').addEventListener('click', runCitySearch);
$('cityInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); runCitySearch(); } });

const stored = await local.get(['profile', 'settings']);
const isFirstRun = !stored.profile?.birthDate;
if (!isFirstRun) {
  $('title').textContent = 'Your almanac';
  $('lede').textContent = 'Update your details at any time. Changes apply from the next page you turn.';
  $('saveBtn').textContent = 'Save changes';
}
fill({ ...DEFAULT_PROFILE, ...stored.profile }, { ...DEFAULT_SETTINGS, ...stored.settings });

$('birthDate').max = new Date().toISOString().slice(0, 10);
$('birthDate').addEventListener('input', updateChartPreview);
$('birthTime').addEventListener('input', updateChartPreview);
$('displaySeconds').addEventListener('input', (e) => { $('secondsOut').textContent = e.target.value; });

$('form').addEventListener('submit', async (e) => {
  e.preventDefault();
  $('error').textContent = '';
  const birthDate = $('birthDate').value;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate) || birthDate > $('birthDate').max) {
    $('error').textContent = 'Please enter a valid birth date.';
    $('birthDate').focus();
    return;
  }
  const workDays = [...$('dayChips').querySelectorAll('input:checked')].map((cb) => Number(cb.value));
  const profile = {
    birthDate,
    birthTime: $('birthTime').value,
    role: document.querySelector('input[name="role"]:checked').value,
    workStart: $('workStart').value || '09:00',
    workEnd: $('workEnd').value || '18:00',
    workDays,
    focus: $('focus').value,
    desk: $('desk').value,
    tone: document.querySelector('input[name="tone"]:checked').value,
    chronotype: document.querySelector('input[name="chronotype"]:checked').value,
    wakeTime: $('wakeTime').value,
    location: location_,
  };
  const settings = {
    autoShow: $('autoShow').checked,
    displaySeconds: Number($('displaySeconds').value),
    sound: $('sound').checked,
    units: $('units').value,
  };
  await local.set({ profile, settings });
  if (location_?.lat !== stored.profile?.location?.lat) await local.remove(['weatherCache']);
  if (isFirstRun) {
    $('form').hidden = true;
    $('done').hidden = false;
    $('tearLink').focus();
  } else {
    $('saveBtn').textContent = 'Saved ✓';
    setTimeout(() => { $('saveBtn').textContent = 'Save changes'; }, 1600);
  }
});
