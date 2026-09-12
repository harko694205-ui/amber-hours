# Amber Hours

A cozy, minimalist Pomodoro timer with a fully synthesized lo-fi ambient soundboard. Built with Next.js 14 (App Router), Tailwind CSS, and Lucide icons.

## Features

- **Pomodoro timer** — Focus (25m), Short break (5m), Long break (15m), with a circular progress ring, Play/Pause/Reset, and automatic mode advancing (every 4th focus block rolls into a long break).
- **Ambient soundboard** — Rain, Vinyl crackle, Cafe murmur, and Tape hiss, each independently toggleable with its own volume fader. All four are **synthesized live in the browser with the Web Audio API** — no audio files are downloaded or bundled.
- **Local persistence** — Daily completed-focus counts and your current streak are stored in `localStorage` and picked back up on your next visit.
- **Dark, glassy UI** — warm charcoal/ember palette, a mixing-console layout for the soundboard, subtle grain texture, and reduced-motion support.

## File structure

```
amber-hours/
├── app/
│   ├── layout.tsx        # Root layout, fonts (Fraunces + IBM Plex Mono), metadata
│   ├── page.tsx          # Assembles header, timer, and soundboard
│   └── globals.css       # Tailwind layers, grain overlay, custom fader styling
├── components/
│   ├── PomodoroTimer.tsx # Timer state machine, ring SVG, stats strip
│   ├── Soundboard.tsx    # Layer config + state for the 4 ambient channels
│   └── ChannelStrip.tsx  # One mixer channel: LED, fader, toggle button
├── lib/
│   ├── noiseEngine.ts    # Web Audio API synthesis for all 4 ambient layers + completion chime
│   ├── stats.ts          # Streak / daily-count calculations over localStorage history
│   └── useLocalStorage.ts# Generic localStorage-backed React state hook
├── public/               # (empty — no external audio/image assets needed)
├── tailwind.config.ts
├── postcss.config.mjs
├── next.config.mjs
├── tsconfig.json
└── package.json
```

## How the sound works

Instead of shipping loopable `.mp3`/`.wav` files, `lib/noiseEngine.ts` builds each ambient layer from an `AudioBuffer` of generated noise routed through `BiquadFilterNode`s (and, for rain/cafe, a slow LFO modulating the filter or gain for movement):

| Layer | Technique |
|---|---|
| Rain | White noise → high-pass → low-pass, cutoff drifting slowly via LFO |
| Vinyl crackle | Sparse random impulses over a low noise floor → band-pass |
| Cafe murmur | White noise → two band-pass stages tuned to speech range → slow LFO-driven swell |
| Tape hiss | White noise → high-pass at 4.5kHz, steady |

This keeps the app dependency-free and avoids any licensing/hosting concerns around ambient sound loops. Because browsers require a user gesture before audio can play, the engine's `AudioContext` is created/resumed on the first toggle or Play press.

## Getting started locally

Requires Node.js 18.17+.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: Amber Hours lo-fi focus app"
git branch -M main
git remote add origin https://github.com/<your-username>/amber-hours.git
git push -u origin main
```

## Deploy to Vercel

**Option A — Dashboard**
1. Go to [vercel.com/new](https://vercel.com/new) and import the GitHub repo you just pushed.
2. Framework preset auto-detects as **Next.js** — leave build/output settings as default (`next build`).
3. Click **Deploy**. No environment variables are required.

**Option B — CLI**
```bash
npm install -g vercel
vercel        # follow prompts, links the project
vercel --prod # deploy to production
```

Either way, every subsequent push to `main` will trigger a new deployment automatically.

## Notes / things you may want to tweak

- Mode durations live in `MODE_SECONDS` in `components/PomodoroTimer.tsx`.
- Default per-layer volumes live in `LAYERS` in `components/Soundboard.tsx`.
- The completion chime is a 3-note synthesized bell in `noiseEngine.playChime()` — replace or silence it there if you'd rather it stay quiet.
- Streak logic (`lib/stats.ts`) counts a "streak day" as any day with ≥1 completed focus block, and stays alive through "yesterday" until today's first block is logged.
