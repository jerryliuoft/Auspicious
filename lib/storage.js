// Thin wrapper over chrome.storage, with a localStorage fallback so pages can be
// previewed in a normal browser tab during development.
const hasChrome = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;

function lsGet(prefix, keys) {
  const out = {};
  for (const k of keys) {
    try {
      const v = localStorage.getItem(prefix + k);
      if (v !== null) out[k] = JSON.parse(v);
    } catch { /* storage unavailable */ }
  }
  return out;
}
function lsSet(prefix, obj) {
  for (const [k, v] of Object.entries(obj)) {
    try { localStorage.setItem(prefix + k, JSON.stringify(v)); } catch { /* ignore */ }
  }
}
function lsRemove(prefix, keys) {
  for (const k of keys) { try { localStorage.removeItem(prefix + k); } catch { /* ignore */ } }
}

const area = (name, prefix) => ({
  get: (keys) => (hasChrome && chrome.storage[name] ? chrome.storage[name].get(keys) : Promise.resolve(lsGet(prefix, keys))),
  set: (obj) => (hasChrome && chrome.storage[name] ? chrome.storage[name].set(obj) : Promise.resolve(lsSet(prefix, obj))),
  remove: (keys) => (hasChrome && chrome.storage[name] ? chrome.storage[name].remove(keys) : Promise.resolve(lsRemove(prefix, keys))),
});

export const local = area('local', 'auspicious.');
export const session = area('session', 'auspicious.session.');
export const isExtension = !!hasChrome;

export const DEFAULT_SETTINGS = { autoShow: true, displaySeconds: 8, sound: true };
