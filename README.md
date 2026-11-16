# Auspicious: Daily Work Almanac

A Chrome extension inspired by the Chinese tear-off almanac (黄历 / Tong Shu), redesigned as a modern editorial desk card. It shows one page a day: a personalized **work fortune**, what the day is good for (宜) and what to avoid (忌), your lucky hour, color and direction, and **remedies (化解)** to ease unlucky days.

> **Privacy:** Auspicious collects nothing. No accounts, no analytics, no tracking. Your details stay in your browser; the only outside requests are to a weather service and your own calendar, and only if you turn those on. See [PRIVACY.md](PRIVACY.md).

## Install (developer mode)

1. Open `chrome://extensions` and switch on **Developer mode** (top right).
2. Click **Load unpacked** and select this folder.
3. The setup page opens automatically. Enter your birth date and work details.
4. Pin **Auspicious** to the toolbar (puzzle-piece icon, then the pin).

Requires Chrome 127+.

## How it behaves

- **First Chrome window of the day**: the toolbar popup opens by itself, turns yesterday's page after about 1 second, and shows today's fortune. It closes after the configured number of seconds (default 8). Hover to pause the countdown, or click anywhere to keep it open.
- Triggers: browser startup, the first new window, or coming back from idle (for Chrome left open overnight). It shows once per day, and not at all if you already turned today's page yourself.
- If the popup can't anchor to the toolbar, a small popup window opens near the top-right of the browser instead.
- Clicking the toolbar icon yourself: if today's page hasn't been turned yet, press and hold the arrow button to turn the page.
- A red **1** badge on the icon means today's page is still waiting.

## The opening experience

Opening the page is built in three beats:

1. **Anticipation (cover).** A greeting for the time of day, a streak nudge ("Turn it to make it 4 days in a row"), and today's color glowing from under the page. Holding the button builds tension: the page lifts, a ring fills, a soft riser tone climbs, the hint changes ("Keep holding…", "Almost…"), and the page trembles just before it gives. Letting go early springs it back.
2. **Payoff (reveal).** The page flips away, the characters rise, and the seal block lands with an impact and a chord: a confetti burst on good days, a few sparkles on steady days, quiet ink drops on hard days.
3. **Reward.** Your **luck** counts up with rising ticks while a ring fills: it ranks today against all of your days this year ("Better than 99% of your days"). Then badges pop in: **Rare · about 1 in 13 days** for top tiers, your **streak**, and milestones (first page, 3, 7, 14, 30… days).

Smaller rewards: each quick fix you tick sparkles and rings a little higher, and finishing them all celebrates. Revisiting later in the day shows the final state instantly. Motion and particles are skipped for users who prefer reduced motion; sound follows the setting.

## Moon blocks (the fidget)

The round **祈** button in the corner opens a small shrine for yes/no wishes ("A great card pull", "Nailing my presentation"…), based on the temple ritual of **jiaobei** (筊杯):

1. Type a wish or tap a suggestion.
2. **Hold to pray**: the incense glows, smoke quickens, the blocks lift and tremble, and a soft tone rises.
3. **Let go to toss**: the two crescent blocks fly up, tumble, clack onto the tray and settle.
4. The verdict stamps in: **聖筊 Yes** (one flat, one round), **笑筊 Ask again** (both flat: the gods are laughing), or **陰筊 Not today** (both round).

Three yeses in a row confirm the wish: the dots pop, confetti flies, and the card gets a **Wish blessed** badge for the day. Fair blocks give yes about half the time; today's luck tilts that only slightly (about 46–56%). It's a toy, and it says so.

## How the fortune is calculated

All on-device and deterministic: the same person on the same date always gets the same page.

| Input | Almanac concept | What it changes |
|---|---|---|
| Today's date | Day pillar (干支) + 12 Day Officers (建除十二神) | Base luck and the 宜/忌 activities |
| Birth year | Zodiac animal (solar year, switches at 立春) | Clash (冲) and harmony (六合/三合) days |
| Birth date (+ time) | Day master element (日主) | Daily theme (simplified Ten Gods), lucky element/color/direction |
| Work hours | Yellow-path hours (黄道吉时) | Best and riskiest hours inside your workday |
| Role | n/a | How 宜/忌 are phrased (e.g. "Open" day → *Start the new repo* for engineers) |
| Focus, desk direction, tone | n/a | Focus line, desk tip, voice of the intro |

**Remedies (化解)** appear on difficult days: zodiac clash (place the day animal's ally on your desk), pressure-element days (wear the mediating element's color), and Break/Danger/Close officer days (practical office rituals). Checking them all off marks the day "Softened". Good days get **Boosts (开运)** instead.

### Why today

Every page explains itself, so it never feels like a randomizer:

- **The calendar**: where today's branch sits against the month's branch, and why that makes it a Break, Success, Open… day.
- **You**: how today's element meets your core element (feeds, supports, pressures, or matches you), plus any zodiac clash or harmony.
- **The hour**: why the best hour is lucky (its yellow-path spirit, and whether it harmonizes with your sign).
- **Nature**: the current solar term and microseason from the traditional 72 pentads (七十二候), with a workday reflection, plus the moon phase. All computed offline (`lib/nature.js`).
- **A classic line**: from the Tao Te Ching, Art of War, Analects, I Ching or Xunzi, matched to the day type, with the original Chinese and our own English rendering (`lib/wisdom.js`).

### Real life first

Real conditions outrank tradition. If you add your city in settings, today's local weather (from [Open-Meteo](https://open-meteo.com), free, no key) shapes the page:

- **The reading moves**: a great day outside lifts it by two steps, a pleasant one by one, dangerous weather lowers it by one. The Why section says what the almanac alone would have said and how the weather changed it.
- **The headline and advice follow the sky**: "Clear skies beat old omens…", an outdoor window like "2–4 pm is the nicest stretch", or "Work from home if you can" during storms.
- **Old signs get a reality check**: when a microseason like "the earth begins to freeze" doesn't match a warm day, the page says to read it as poetry. Southern Hemisphere users see the local season.

Without a city, the page follows the almanac only.

### Your energy

An estimated energy forecast (0–100) for the whole day, used to time every suggestion. It is not a biometric measurement; it combines:

- **Your body clock**: grogginess after waking, a late-morning peak, the post-lunch dip, a second wind, and the evening decline, shifted by chronotype (morning person, in between, night owl) and wake-up time from settings.
- **Last night's sleep**: a one-tap check-in on the card (Great / Okay / Rough) sets how full the tank starts.
- **Your calendar**: meetings drain energy, back-to-back runs drain more, and breaks and lunch recharge.
- **Daylight**: a good-weather outdoor window recharges.

The card shows the forecast curve with your peak, dip, meetings and a "now" marker. Each Do item gets a timing note ("Best at your peak, 9–11 am", "Fits your 2:45–3:45 pm dip", "High energy then (≈74)"), each meeting gets an energy meter, and big meetings that land in a low patch are flagged ("Prep notes and grab water first").

### Your calendar

Paste your calendar's private iCal (ICS) link in settings (Google, Outlook/Microsoft 365, and Apple all provide one). A **Your day** section then lines up today's meetings with the day:

- **Each meeting is tagged** by the hour it lands in (best, clear, or careful hour) and checked against today's Do/Skip guidance. A contract negotiation on a day that warns against negotiating is flagged ("Over-prepare, or move it if it can wait"); a demo on a day that favors presenting is "well timed".
- **Insights**: your clearest focus block (and whether it overlaps your best hour), heavy-meeting days, back-to-back runs, and breaks that line up with the nicest weather.
- **Do/Skip lead with real life**: weather and calendar items first, almanac items after.
- **Out of office** (an all-day OOO/vacation event) turns the page into a day off, with a nudge to decline meetings still on the calendar.

The parser (`lib/ics.js`) handles time zones, all-day events, recurring meetings (daily/weekly/monthly/yearly, intervals, counts, end dates, BYDAY, exceptions) and moved or cancelled instances. Chrome asks for permission to read only the calendar provider's site, at the moment you connect, so installing the extension shows no extra warning.

Profile and settings live only in `chrome.storage.local`. Required permissions are `storage` and `idle`; reading a calendar uses an optional host permission granted for that one site when you connect it. Network requests go only to Open-Meteo (city search and a forecast for your city's rounded coordinates, cached three hours) and to your calendar provider (your ICS link, cached 30 minutes). The calendar link and event titles never leave the browser otherwise.

## Project layout

```
manifest.json        MV3 manifest
background.js        Service worker: daily auto-show, badge
fortune.html/.js     The tear-off pad (toolbar popup, fallback window, or tab)
settings.html/.js    Onboarding + settings
lib/almanac.js       Calendar math: pillars, solar terms, officers, hours, relations
lib/content.js       All fortune text (activities by role, officers, remedies, tiers)
lib/fortune-engine.js  Combines almanac + profile into a daily fortune
lib/storage.js       chrome.storage wrapper (localStorage fallback for previews)
lib/sound.js         Synthesized page flip / tick / chime (no audio files)
styles/              CSS
icons/               Toolbar icons
tests/               Node unit tests
dev/seed.html        Dev only: seeds a test profile for browser previews
```

## Development

```bash
npm test
```

Preview pages without installing: serve the folder (`python dev/serve.py 8765`, a no-cache static server), then open
`http://localhost:8765/dev/seed.html?to=fortune.html`. Useful query params on `fortune.html`:
`date=YYYY-MM-DD` (preview another day), `auto=1` (startup behavior with auto-tear and auto-close),
`reset=1` (un-turn today), `mode=tab|window`, `nofx=1` (no particles). On `dev/seed.html`: `hist=2026-11-15,2026-11-16`
(previously turned days, for streaks), `lat`/`lon`/`city` (test location), `units=f`. `dev/fxtest.html` logs particle motion.
