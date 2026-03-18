# CUDA Pipeline Explorer Demo

A local-first HTML/CSS/JavaScript demo game that helps you explore CUDA-style GPU pipeline behavior.

## What it does

- Lets you tune 4 pipeline stages:
  - Kernel front-end (warp issue)
  - SM compute (occupancy)
  - Memory fabric (bandwidth and L2 hit)
  - Sync/barrier overhead
- Computes simulated GPU telemetry metrics.
- Shows optimization notes (bottlenecks, cache issues, occupancy hints).
- Gives a score so you can iterate like a game.

## Run locally (macOS / Windows / Linux)

Because this is a static web app, you can run it with any simple local server:

```bash
python3 -m http.server 8000
```

Then open:

- `http://localhost:8000` on desktop browsers
- or from mobile on the same network: `http://<your-computer-ip>:8000`

## Mobile support (iOS / Android)

- Works in Safari (iOS) and Chrome (Android).
- UI is responsive and touch-friendly.
- No build step required.

## Files

- `index.html` - app structure
- `styles.css` - visual theme and responsive layout
- `app.js` - game logic and telemetry simulation
