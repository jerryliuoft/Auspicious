# Privacy

**Short version: Auspicious does not collect anything.** There are no accounts, no analytics, no tracking, no ads, and no Auspicious servers. Everything you enter stays in your own browser.

_Last updated: November 15, 2026_

## What stays on your computer

All data is kept in Chrome's local extension storage (`chrome.storage.local`) on your device. It is never uploaded anywhere by Auspicious.

| What | Why |
|---|---|
| Birth date (and optional birth time) | Calculates your zodiac sign and element for the almanac |
| Role, work hours, work days, focus, desk direction, tone | Personalizes the advice and its wording |
| Chronotype and wake-up time | Shapes your energy forecast |
| City name and coordinates, temperature unit | Fetches local weather |
| Calendar link (if you connect one) | Reads today's meetings |
| Cached weather forecast and today's meetings (titles and times) | Lets the page open instantly and work offline |
| Pages turned (dates only), quick-fix checkmarks, sleep check-ins, today's wish | Streaks, rewards, and remembering your day |
| Display settings (pop-up on/off, duration, sound) | Your preferences |

## What leaves your computer, and to whom

Auspicious only talks to two kinds of services, and only for features you turn on:

1. **[Open-Meteo](https://open-meteo.com) (weather)**, only if you set a city:
   - When you search for a city, the name you type is sent to Open-Meteo's geocoding service.
   - To get the forecast, your city's coordinates **rounded to two decimals** (about 1 km) are sent. No name, email, account, or identifier is included.
2. **Your own calendar provider** (for example Google, Microsoft, or Apple), only if you connect a calendar: Auspicious downloads your calendar from the private iCal link you pasted. Nothing is sent back.

These services have their own privacy policies. Auspicious sends them nothing beyond what is listed above.

Everything else (the almanac, fortunes, energy forecast, luck scores, moon blocks) is calculated on your device. The extension contains no remote code.

## Permissions

| Permission | Why it's needed |
|---|---|
| `storage` | Save your settings and daily state on your device |
| `idle` | Notice when you come back to your computer, so the daily page can show the first time you use Chrome each day |
| Optional site access | Requested only when you connect a calendar, and only for that calendar provider's site, so the link can be read. Disconnecting removes it. |

Auspicious does not read your browsing history, the pages you visit, or anything in other tabs.

## Your control

- **Disconnect** your calendar or **remove** your city at any time in settings.
- **Uninstalling** the extension deletes all of its stored data from your browser.
- Your calendar link works like a password: anyone with it can read your calendar. Auspicious keeps it only in your browser, and you can reset it with your calendar provider at any time.

## Questions

Open an issue on this repository.
