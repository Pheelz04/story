# LAMBA — AI Video Studio

A React + Node.js dashboard for generating AI videos from text prompts and sharing them with a community.

- **Sidebar navigation:** Home, Studio / Create, Community Gallery, Profile. On phones it becomes a bottom tab bar.
- **Prompt workspace:** a prompt box with a character count and a "Surprise me" button. Model, style and camera dropdowns. Aspect ratio (16:9 / 9:16 / 1:1) and duration (5s / 10s) options. An optional negative prompt. A live credit cost and a **Generate** button (Ctrl/⌘ + Enter also generates).
- **Generation queue:** each job shows its stage and a progress bar. Finished videos drop straight into your grid.
- **Video grid:** a masonry layout with **hover-to-play** previews (tap to open on touch devices). Each card shows:
  - metadata: prompt, model, style, aspect, duration, author, age and views
  - community controls: like, remix (reloads the prompt into the Studio) and share (copy link, native share, X, WhatsApp, Facebook, Reddit)
  - on your own videos: publish/private, download and delete
- **Community Gallery:** sort by Trending / Newest / Most liked, filter by aspect ratio, search prompts, infinite scroll, and shareable deep links (`/gallery?v=<id>`) that open a video's details.
- **Profile:** editable name and bio, stats, and tabs for My videos and Liked.

## Run it

Requires Node.js 18+.

```bash
npm run setup     # installs root, server and client dependencies
npm run dev       # API on http://localhost:4000, app on http://localhost:5173
```

Production (one port):

```bash
npm run build     # builds the React app into client/dist
npm start         # Express serves the API + the built app on http://localhost:4000
```

Delete `server/data/db.json` (or `POST /api/dev/reset`) to restore the demo data.

## Install it as an app (PWA)

LAMBA is an installable web app. It opens in its own window with its own icon and still loads when offline.

The install option only appears on the production build (`npm run build && npm start`); the dev server skips the service worker on purpose. You can test installs on `http://localhost:4000`, but anyone else needs the app hosted on **HTTPS**.

| Device | How to install |
|---|---|
| Windows / Mac / Linux (Chrome or Edge) | Click **Install LAMBA** in the sidebar, or the install icon in the address bar |
| Android (Chrome) | Tap **Install app** in the top bar, or ⋮ → *Install app* |
| iPhone / iPad (Safari) | Tap **Install app** for instructions: Share → *Add to Home Screen* |

What's included:
- `client/public/manifest.webmanifest`: the app name, icons (including a maskable one for Android), shortcuts to Create, Gallery and Profile, and screenshots for the install dialog.
- `client/public/sw.js`, a service worker that caches:
  - the app pages and their code and images
  - the last list of videos from the server, so feeds and profiles still show offline
  - not video files, which are too large; those always stream from the server
- An offline banner, a fallback "you're offline" page, and an **Update** prompt when a new version is deployed. Bump `VERSION` in `sw.js` when you change its caching rules.

### Putting it online so people can download it

Express serves both the API and the built app, so it deploys as a single Node service on Render, Railway, Fly.io, a VPS and similar hosts:

- **Build command:** `npm run setup && npm run build`
- **Start command:** `npm start` (the port comes from the host's `PORT` environment variable)

These hosts give you HTTPS automatically. Share the link, and visitors get the Install button.

## Project layout

```
server/
  src/index.js       Express API + static hosting of the built client
  src/generator.js   Generation queue (simulated) ← plug your real model in here
  src/catalog.js     Models, styles, camera moves, aspect ratios, sample clips
  src/store.js       JSON-file persistence (server/data/db.json)
  src/seed.js        Demo users and videos
  public/samples/    Bundled sample clips + posters
client/
  src/App.jsx        Shell: sidebar, top bar, routes
  src/pages/         Home, Studio, Gallery, Profile
  src/components/    PromptWorkspace, JobQueue, VideoGrid, VideoCard, VideoModal, ShareMenu, Sidebar, Topbar…
  src/styles.css     Design tokens + all styles
  public/            LAMBA logo + favicon
```

## API

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/config` | Models, styles, camera moves, aspect ratios, durations |
| GET / PATCH | `/api/me` | Current user, credits and stats / update name and bio |
| GET | `/api/videos?scope=community\|mine\|liked&sort=trending\|new\|top&aspect=&q=&cursor=&limit=` | Paged video list |
| GET | `/api/videos/:id` | One video |
| POST | `/api/videos/:id/like` | Toggle like |
| POST | `/api/videos/:id/share` | Count a share |
| POST | `/api/videos/:id/remix` | Count a remix and return its settings |
| POST | `/api/videos/:id/view` | Count a view |
| POST | `/api/videos/:id/publish` | `{ published: boolean }` (owner only) |
| DELETE | `/api/videos/:id` | Delete (owner only) |
| POST | `/api/generate` | Start a job: `{ prompt, negativePrompt, model, style, camera, aspectRatio, duration }` |
| GET | `/api/jobs`, `/api/jobs/:id` | Job status and progress; the finished video is included when done |

## Connecting a real video model

Generation is simulated. To connect a real model, open `server/src/generator.js` and replace `runProvider()` so it:

1. sends the job to your provider,
2. polls it (or waits for its webhook) until the video is ready,
3. returns `{ videoUrl, posterUrl }`.

Keep your provider API key in an environment variable on the server, never in the client. Everything else (credits, progress, the grid, sharing) works unchanged.

## Next steps for production

- Real auth (replace `CURRENT_USER` in `server/src/index.js`).
- A database instead of the JSON file.
- Object storage or a CDN for videos.
- Rate limiting on `/api/generate`.
- Payments for credits.

## Windows app (.exe installer)

`desktop/` wraps LAMBA in Electron. The Express server runs *inside* the app on `127.0.0.1`, so the desktop app needs no separate server. Videos and your profile are saved in `%APPDATA%\LAMBA\data`. The *LAMBA → Open data folder* menu item opens that folder.

Build the installer on a Windows PC (Node 18+):

```bash
npm run setup
npm run build:desktop      # → desktop/release/LAMBA-Setup-1.0.0.exe
```

To run it without installing: `npm run desktop:start`.

The installer lets users pick the install folder, adds Desktop and Start Menu shortcuts and an uninstaller, and launches LAMBA when it finishes.

Because the installer isn't code-signed, Windows SmartScreen may show "Windows protected your PC". Click **More info → Run anyway**. Signing the installer with a code-signing certificate removes this warning; electron-builder signs automatically when `CSC_LINK` and `CSC_KEY_PASSWORD` are set.

## Android app (.apk)

`client/android/` is a Capacitor project. The Android build runs in **standalone mode** (`client/.env.mobile` sets `VITE_API_MODE=local`): the backend runs inside the app, data is saved on the phone, and the sample clips are bundled in. It works with no server and no internet.

To make the phone app use your hosted LAMBA server instead, set `VITE_API_MODE=remote` and `VITE_API_BASE=https://your-server` in `client/.env.mobile`, then sync again.

**Option A: GitHub (no Android tools needed).** Push the project to GitHub, then open **Actions → Build LAMBA apps → Run workflow**. When it finishes, download `LAMBA.apk` (and the Windows `.exe`) from the run's *Artifacts*. Pushing a tag such as `v1.0.0` also publishes both files on a Release page. For a signed release APK and a Play Store `.aab`, add the keystore secrets listed at the top of `.github/workflows/build-apps.yml`.

**Option B: Android Studio.**

```bash
npm run setup
npm run build:android      # builds the web app and copies it into client/android
```

Then open the `client/android` folder in Android Studio and choose **Build → Build App Bundle(s) / APK(s) → Build APK(s)**. The APK lands in `client/android/app/build/outputs/apk/debug/`.

**Installing the APK on a phone:** copy it to the phone, tap it, and allow "Install unknown apps" for your file manager or browser when Android asks.

When you change the web app, run `npm run build:android` again before rebuilding the APK.

## Share links in the apps

Inside the desktop and Android apps, the page's address is a local one. Set `VITE_PUBLIC_URL` in `client/.env.desktop` and `client/.env.mobile` to your hosted website so "Copy link" and the share buttons point somewhere real.
