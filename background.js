// Auspicious — background service worker.
// Shows today's page automatically the first time Chrome is used each day:
// at browser startup, when the first window opens, or when the user returns from idle.
import { dateKey } from './lib/fortune-engine.js';
import { getWeather } from './lib/weather-fetch.js';
import { getEventsFor } from './lib/calendar-fetch.js';

const todayKey = () => dateKey(new Date());
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let showing = false;

async function refreshBadge() {
  const { tornOn, profile } = await chrome.storage.local.get(['tornOn', 'profile']);
  const pending = !!profile?.birthDate && tornOn !== todayKey();
  await chrome.action.setBadgeText({ text: pending ? '1' : '' });
  await chrome.action.setBadgeBackgroundColor({ color: '#b3261e' });
  await chrome.action.setTitle({ title: pending ? 'Auspicious: a new page is waiting' : 'Auspicious: today’s fortune' });
}

/** Wait (briefly) for a focused normal browser window; at startup it may not exist yet. */
async function waitForWindow() {
  let last = null;
  for (let i = 0; i < 12; i++) {
    try {
      last = await chrome.windows.getLastFocused({ windowTypes: ['normal'] });
      if (last && last.focused && last.state !== 'minimized') return last;
    } catch { /* no window yet */ }
    await sleep(500);
  }
  return last;
}

async function openFallbackWindow(win) {
  const width = 400, height = 628;
  const opts = { url: 'fortune.html?mode=window&auto=1', type: 'popup', width, height, focused: true };
  if (win && win.left != null && win.width) {
    opts.left = Math.max(0, win.left + win.width - width - 24);
    opts.top = Math.max(0, win.top + 72);
  }
  await chrome.windows.create(opts);
}

async function maybeShow(reason) {
  if (showing) return;
  showing = true;
  try {
    const { profile, settings = {}, lastAutoShown, tornOn } =
      await chrome.storage.local.get(['profile', 'settings', 'lastAutoShown', 'tornOn']);
    const key = todayKey();
    if (!profile?.birthDate || settings.autoShow === false) return;
    if (lastAutoShown === key || tornOn === key) return;

    const win = await waitForWindow();
    if (!win) return;
    // Warm the weather cache so the popup can lead with real conditions.
    await Promise.all([
      profile.location ? getWeather(profile.location, { timeoutMs: 3000 }) : null,
      getEventsFor(new Date(), { timeoutMs: 3000 }),
    ]);
    await sleep(reason === 'startup' ? 1200 : 400); // let the window settle

    await chrome.storage.session.set({ autoOpenAt: Date.now() });
    try {
      await chrome.action.openPopup({ windowId: win.id });
    } catch {
      await chrome.storage.session.remove('autoOpenAt');
      await openFallbackWindow(win);
    }
    await chrome.storage.local.set({ lastAutoShown: key });
  } catch (err) {
    console.warn('Auspicious: could not show daily page', err);
  } finally {
    showing = false;
  }
}

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  chrome.idle.setDetectionInterval(15 * 60);
  if (reason === 'install') await chrome.tabs.create({ url: 'settings.html' });
  refreshBadge();
});

chrome.runtime.onStartup.addListener(() => {
  chrome.idle.setDetectionInterval(15 * 60);
  refreshBadge();
  maybeShow('startup');
});

chrome.windows.onCreated.addListener((w) => {
  if (w.type === 'normal') { refreshBadge(); maybeShow('window'); }
});

// Chrome left open overnight: show the page when the user comes back.
chrome.idle.onStateChanged.addListener((state) => {
  if (state === 'active') { refreshBadge(); maybeShow('idle'); }
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && (changes.tornOn || changes.profile)) refreshBadge();
});
