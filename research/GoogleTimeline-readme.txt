# TripReel 🗺️

**Built by Dev Parth** · © 2026 Dev Parth · [MIT License](LICENSE)

Turn a **Google Takeout “Timeline” export** into a shareable travel video — with an animated map, a marker that follows your journey, and a zoomed-out ending view.

**100% on-device.** Your location data never leaves your phone. The only network requests are for map tiles (roads & place names) — they never contain your positions.

One codebase, two platforms:

- 📱 **Android** — open in Chrome and *Install app* (PWA), or wrap it in Capacitor for a Play-Store-ready APK.
- 🍎 **iPhone / iPad** — open in Safari and *Add to Home Screen*. No app store, no account, no upload.

---

## Quick start

You need this app served over **http(s)** (a service worker + module-free scripts won’t run from `file://` on most phones).

**Option A — this workspace preview.** The live preview link shown in Arena opens the full app in your browser.

**Option B — any static server, one command:**

```bash
cd treel
python3 -m http.server 8080
# open http://localhost:8080 on the same machine
```

Or drag the `treel/` folder onto any static host (GitHub Pages, Netlify, Cloudflare Pages, S3…). HTTPS is recommended for PWA install on Android.

### The flow (3 steps)

1. **Import** — tap *Choose file* and pick your `timeline.json` (or the whole Takeout `.zip`). No file handy? *Try the sample trip* loads a demo Delhi → Agra journey.
2. **Dates** — pick the start/end dates of your trip (or one day). You can see the distance and point count update live.
3. **Preview → Create video** — watch the animated map, then tap *Create video*. The MP4 is rendered **on your phone** and saved to *My videos*.

### My videos

- Play, **Share** (native share sheet → WhatsApp, iMessage, etc.), **Save** (download), or **Delete** any video.
- **Add video** imports older MP4s you already have — they join the library with a thumbnail.
- Everything is stored in your browser’s local storage (IndexedDB). Nothing is synced anywhere.

### Settings

| Setting | Choices |
|---|---|
| Language | English, हिन्दी, Español, Français, Deutsch, 日本語 |
| Video size | Vertical 720×1280 (default, phone sharing) · Vertical HD 1080×1920 · Landscape 1280×720 · Square 1080×1080 |
| Camera movement | Follow (smooth chase) · Cinematic (slow & wide) · Fixed overview |
| Animation speed | Slow / Normal / Fast |
| Map style | Standard (OSM streets) · Dark · Simple (works fully offline) |
| Show date & distance | toggle |
| Zoomed-out ending view | toggle (the “reveal” at the end) |

---

## Getting your Timeline file from Google

1. **Location history must have been ON** while you travelled (Google app → *Settings → Location history*).
2. Open <https://takeout.google.com> and sign in.
3. **Untick everything**, then expand **Location history** and tick **Timeline**.
4. Set the time range (your trip is fine — smaller = faster), keep format **Timeline (JSON)**, press **Create export**.
5. Minutes later Google e-mails you a download link — download the **.zip**.
6. In TripReel: *Choose file* → pick the zip (the app finds `timeline.json` inside automatically).

> Tip: a narrower date range (just your trip) makes exports smaller and the app snappier. You can still import “all time” and pick dates later.

## Privacy

- Parsing, route building, map rendering, and MP4 encoding all happen **locally in your browser** (WebCodecs + [MediaBunny](https://mediabunny.dev), vendored in `vendor/`).
- Your coordinates are never sent to any server. Map tile requests (OpenStreetMap / CARTO) contain only tile numbers.
- Your videos and settings live in IndexedDB on the device. *Settings → Delete all app data* wipes everything.
- Set **Map style → Simple** and the app works with **zero network access**.

## How the video is made

- Points in your date range are sorted, de-duplicated and (if sparse) smoothed with Catmull-Rom.
- A camera path is precomputed (chase / cinematic / overview) plus a 4 s eased **zoom-out** into a 2.5 s title card (trip name, dates, total distance).
- Every frame (30 fps) is drawn on a `<canvas>` — tiles, route, glowing traveled path, start/end pins, pulsing marker, date & km chips.
- Frames are encoded into **MP4** with WebCodecs. Codec preference: **H.264** (plays everywhere, incl. iPhone) → HEVC → VP9 (with a warning on iOS). On older iOS Safari a **real-time `MediaRecorder` H.264 MP4** capture path is used instead (export then takes the same time as the video — keep the screen open).
- A JPEG poster frame is captured for the library thumbnail.

## Android

- **PWA:** Chrome → menu ⋮ → *Install app* (or *Add to Home screen*). Runs fullscreen, offline-capable after first load.
- **Native APK (optional):**

  ```bash
  npm init -y
  npm i @capacitor/core @capacitor/cli
  npx cap init TripReel com.example.tripreel --web-dir=treel
  npx cap add android
  npx cap sync
  npx cap open android
  ```

## iPhone / iPad

- Safari → Share → **Add to Home Screen**. (iOS PWAs are slightly less capable than Android — e.g. no full-screen camera-style launch on older iOS — but the whole create/share flow works.)
- Exporting needs iOS 16.4+ (WebCodecs) for the fast path; iOS 14.3+ works via the real-time recorder fallback.

## Troubleshooting

| Symptom | Fix |
|---|---|
| “Couldn’t read that file” | Make sure you picked `timeline.json` or the Takeout zip (not `records.json` of a different product). The app also accepts the raw `locations[]` format and semantic monthly files. |
| “No location points in that range” | Your phone’s location history may be sparse; widen the date range. |
| Video creation fails | Use a current Chrome/Edge (Android/desktop) or Safari 16.4+/14.3+ (iOS). H.264 encode support varies; the app auto-falls back H.264 → HEVC → VP9 → real-time recorder. |
| Video won’t play on iPhone | It was encoded as VP9 (device couldn’t do H.264). Re-create on a device/browser that supports H.264, or share it to a non-Apple device. |
| Map looks blank in preview | You’re offline — switch **Map style → Simple**, or re-connect for tiles. |
| Private/incognito mode | Videos only survive that session (no persistent storage). Use a normal tab for your library. |
| Large exports (years of data) | Import a narrower Takeout range; the app downsamples dense data automatically (4k points cap). |

## Project layout

```
treel/
├── LICENSE               # MIT — © 2026 Dev Parth (app code)
├── index.html            # UI shell + all CSS (no external assets)
├── app.js                # the whole app (i18n, parsing, camera, rendering, export, gallery)
├── sw.js                 # service worker (app shell + bounded tile cache)
├── manifest.webmanifest  # PWA manifest
├── sample-trip.js/.json  # built-in demo trip (Delhi → Agra, Takeout format)
├── vendor/
│   ├── mediabunny.min.cjs  # v1.55 — MP4 muxing (script-tag global, MPL-2.0)
│   └── jszip.min.js        # zip reading (MIT)
├── icons/                # generated PWA icons
└── gen-sample.js / gen-icons.py   # dev scripts
```

## Credits & licenses

- **TripReel** (app code, UI, icons, sample trip) — © 2026 **Dev Parth**, [MIT License](LICENSE).
- [MediaBunny](https://mediabunny.dev) — MPL-2.0 (vendored in `vendor/`)
- [JSZip](https://stuk.github.io/jszip/) — MIT (vendored in `vendor/`)
- Map tiles © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright) · dark tiles © [CARTO](https://carto.com/attributions)
- Sample trip coordinates are approximate demo data.
