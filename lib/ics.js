// Auspicious — minimal iCalendar (.ics) reader: enough for work calendars from
// Google, Outlook, and Apple. Handles time zones, all-day events, and common
// recurrence rules (DAILY/WEEKLY/MONTHLY/YEARLY, INTERVAL, COUNT, UNTIL, BYDAY,
// BYMONTHDAY, EXDATE) plus moved/cancelled instances (RECURRENCE-ID).

const DAY_CODES = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

/** Split raw text into unfolded content lines. */
function unfold(text) {
  return text.replace(/\r\n/g, '\n').replace(/\n[ \t]/g, '').split('\n').filter(Boolean);
}

/** Parse "NAME;P1=V1;P2=V2:VALUE" into { name, params, value }. */
function parseLine(line) {
  let i = 0, inQuote = false;
  for (; i < line.length; i++) {
    const c = line[i];
    if (c === '"') inQuote = !inQuote;
    else if (c === ':' && !inQuote) break;
  }
  const head = line.slice(0, i), value = line.slice(i + 1);
  const [name, ...rest] = head.split(';');
  const params = {};
  for (const p of rest) {
    const eq = p.indexOf('=');
    if (eq > 0) params[p.slice(0, eq).toUpperCase()] = p.slice(eq + 1).replace(/^"|"$/g, '');
  }
  return { name: name.toUpperCase(), params, value };
}

const unescapeText = (s) => s.replace(/\\n/gi, ' ').replace(/\\([,;\\])/g, '$1').trim();

/** Offset (ms) of an IANA zone at a given instant; throws for unknown zones. */
const FORMATTERS = new Map();
function zoneOffset(utcMs, tz) {
  let fmt = FORMATTERS.get(tz);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
    FORMATTERS.set(tz, fmt);
  }
  const p = Object.fromEntries(fmt.formatToParts(new Date(utcMs)).map((x) => [x.type, x.value]));
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return asUtc - utcMs;
}

/** Convert wall-clock time in a zone to a Date. tz: IANA name, 'UTC', or null for local. */
export function wallToDate({ y, m, d, h = 0, mi = 0, s = 0 }, tz) {
  if (tz === 'UTC') return new Date(Date.UTC(y, m - 1, d, h, mi, s));
  if (tz) {
    try {
      const guess = Date.UTC(y, m - 1, d, h, mi, s);
      let t = guess - zoneOffset(guess, tz);
      t = guess - zoneOffset(t, tz); // second pass handles DST edges
      return new Date(t);
    } catch { /* unknown zone (e.g. Windows names): fall through to local */ }
  }
  return new Date(y, m - 1, d, h, mi, s);
}

/** Parse a DATE or DATE-TIME property into { wall, tz, allDay }. */
function parseDateProp(prop) {
  const v = prop.value.trim();
  const m = v.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/);
  if (!m) return null;
  const allDay = prop.params.VALUE === 'DATE' || !m[4];
  const wall = { y: +m[1], m: +m[2], d: +m[3], h: +(m[4] || 0), mi: +(m[5] || 0), s: +(m[6] || 0) };
  const tz = m[7] ? 'UTC' : allDay ? null : (prop.params.TZID || null);
  return { wall, tz, allDay };
}

function parseDuration(v) {
  const m = v.match(/^([+-])?P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/);
  if (!m) return 0;
  const ms = ((+(m[2] || 0) * 7 + +(m[3] || 0)) * 86400 + +(m[4] || 0) * 3600 + +(m[5] || 0) * 60 + +(m[6] || 0)) * 1000;
  return m[1] === '-' ? -ms : ms;
}

function parseRRule(v) {
  const r = {};
  for (const part of v.split(';')) {
    const [k, val] = part.split('=');
    if (k && val) r[k.toUpperCase()] = val;
  }
  return {
    freq: r.FREQ,
    interval: Math.max(1, +(r.INTERVAL || 1)),
    count: r.COUNT ? +r.COUNT : null,
    until: r.UNTIL ? parseDateProp({ value: r.UNTIL, params: {} }) : null,
    byday: r.BYDAY ? r.BYDAY.split(',').map((x) => {
      const mm = x.match(/^([+-]?\d+)?([A-Z]{2})$/);
      return mm ? { n: mm[1] ? +mm[1] : null, day: DAY_CODES.indexOf(mm[2]) } : null;
    }).filter((x) => x && x.day >= 0) : null,
    bymonthday: r.BYMONTHDAY ? r.BYMONTHDAY.split(',').map(Number) : null,
  };
}

/** Parse ICS text into raw VEVENT records. */
export function parseICS(text) {
  const events = [];
  let cur = null;
  for (const line of unfold(text)) {
    const p = parseLine(line);
    if (p.name === 'BEGIN' && p.value === 'VEVENT') { cur = { exdates: [] }; continue; }
    if (p.name === 'END' && p.value === 'VEVENT') { if (cur?.start) events.push(cur); cur = null; continue; }
    if (!cur) continue;
    switch (p.name) {
      case 'UID': cur.uid = p.value; break;
      case 'SUMMARY': cur.title = unescapeText(p.value); break;
      case 'DTSTART': cur.start = parseDateProp(p); break;
      case 'DTEND': cur.end = parseDateProp(p); break;
      case 'DURATION': cur.duration = parseDuration(p.value); break;
      case 'RRULE': cur.rrule = parseRRule(p.value); break;
      case 'EXDATE':
        for (const v of p.value.split(',')) {
          const d = parseDateProp({ value: v, params: p.params });
          if (d) cur.exdates.push(d);
        }
        break;
      case 'RECURRENCE-ID': cur.recurrenceId = parseDateProp(p); break;
      case 'STATUS': cur.status = p.value.toUpperCase(); break;
      case 'TRANSP': cur.transp = p.value.toUpperCase(); break;
      default: break;
    }
  }
  return events;
}

// ---------- recurrence expansion ----------

const addDays = (w, n) => { const t = new Date(Date.UTC(w.y, w.m - 1, w.d + n)); return { ...w, y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() }; };
const weekday = (w) => new Date(Date.UTC(w.y, w.m - 1, w.d)).getUTCDay();
const dateNum = (w) => w.y * 10000 + w.m * 100 + w.d;
const daysInMonth = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();

function nthWeekdayOfMonth(y, m, day, n) {
  if (n > 0) {
    const first = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
    const d = 1 + ((day - first + 7) % 7) + (n - 1) * 7;
    return d <= daysInMonth(y, m) ? d : null;
  }
  const last = daysInMonth(y, m);
  const lastDay = new Date(Date.UTC(y, m - 1, last)).getUTCDay();
  const d = last - ((lastDay - day + 7) % 7) + (n + 1) * 7;
  return d >= 1 ? d : null;
}

/** Candidate start dates (wall) for one recurrence period. */
function periodDates(rule, base, k) {
  const out = [];
  if (rule.freq === 'DAILY') out.push(addDays(base, k * rule.interval));
  else if (rule.freq === 'WEEKLY') {
    const weekStart = addDays(base, -((weekday(base) + 6) % 7) + k * 7 * rule.interval); // Monday-based weeks
    const days = rule.byday ? rule.byday.map((b) => b.day) : [weekday(base)];
    for (const dd of days) out.push(addDays(weekStart, (dd + 6) % 7));
  } else if (rule.freq === 'MONTHLY') {
    const total = base.m - 1 + k * rule.interval;
    const y = base.y + Math.floor(total / 12), m = (total % 12) + 1;
    if (rule.byday && rule.byday.some((b) => b.n)) {
      for (const b of rule.byday) {
        const d = nthWeekdayOfMonth(y, m, b.day, b.n || 1);
        if (d) out.push({ ...base, y, m, d });
      }
    } else {
      for (const md of rule.bymonthday || [base.d]) {
        const d = md > 0 ? md : daysInMonth(y, m) + md + 1;
        if (d >= 1 && d <= daysInMonth(y, m)) out.push({ ...base, y, m, d });
      }
    }
  } else if (rule.freq === 'YEARLY') {
    const y = base.y + k * rule.interval;
    if (base.d <= daysInMonth(y, base.m)) out.push({ ...base, y });
  }
  return out.sort((a, b) => dateNum(a) - dateNum(b));
}

/**
 * Events overlapping a local calendar day [dayStart, dayEnd).
 * Returns [{ title, start: Date, end: Date, allDay }], sorted by start.
 */
export function eventsOn(records, day) {
  const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  const dayEnd = new Date(dayStart.getTime() + 86400000);
  const overridden = new Set();
  for (const r of records) {
    if (r.recurrenceId && r.uid) overridden.add(`${r.uid}|${wallToDate(r.recurrenceId.wall, r.recurrenceId.tz).getTime()}`);
  }
  const out = [];
  const push = (r, startDate) => {
    let endDate;
    if (r.end) {
      const s0 = wallToDate(r.start.wall, r.start.tz), e0 = wallToDate(r.end.wall, r.end.tz);
      endDate = new Date(startDate.getTime() + (e0 - s0));
    } else if (r.duration) endDate = new Date(startDate.getTime() + r.duration);
    else endDate = new Date(startDate.getTime() + (r.start.allDay ? 86400000 : 3600000));
    if (startDate < dayEnd && endDate > dayStart) {
      out.push({ title: r.title || 'Busy', start: startDate, end: endDate, allDay: r.start.allDay });
    }
  };

  for (const r of records) {
    if (r.status === 'CANCELLED' || !r.start) continue;
    if (!r.rrule || r.recurrenceId) { push(r, wallToDate(r.start.wall, r.start.tz)); continue; }
    const rule = r.rrule;
    if (!['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'].includes(rule.freq)) { push(r, wallToDate(r.start.wall, r.start.tz)); continue; }
    const startNum = dateNum(r.start.wall);
    const until = rule.until ? wallToDate(rule.until.wall, rule.until.tz) : null;
    const ex = new Set(r.exdates.map((e) => wallToDate(e.wall, e.tz).getTime()));
    let count = 0;
    // Without COUNT we can jump close to the target day instead of walking from the first occurrence.
    let k0 = 0;
    if (!rule.count && (rule.freq === 'DAILY' || rule.freq === 'WEEKLY')) {
      const startDay = Date.UTC(r.start.wall.y, r.start.wall.m - 1, r.start.wall.d);
      const targetDay = Date.UTC(dayStart.getFullYear(), dayStart.getMonth(), dayStart.getDate());
      const periodDays = (rule.freq === 'DAILY' ? 1 : 7) * rule.interval;
      k0 = Math.max(0, Math.floor((targetDay - startDay) / 86400000 / periodDays) - 1);
    }
    for (let k = k0; k < k0 + 5000; k++) {
      const dates = periodDates(rule, r.start.wall, k);
      let past = false;
      for (const w of dates) {
        if (dateNum(w) < startNum) continue;
        const occ = wallToDate(w, r.start.tz);
        if (until && occ > until) { past = true; break; }
        count++;
        if (rule.count && count > rule.count) { past = true; break; }
        if (occ >= dayEnd) { past = true; break; }
        if (ex.has(occ.getTime()) || overridden.has(`${r.uid}|${occ.getTime()}`)) continue;
        push(r, occ);
      }
      if (past) break;
    }
  }
  return out.sort((a, b) => a.start - b.start);
}
