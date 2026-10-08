# Beamline Tank: handover

A LaserTank-style puzzle game (turn-based tank, lasers, mirrors, crates, anti-tanks). It runs as a single-file web page and as an installable PWA for phones. It uses no frameworks or dependencies, and every level is checked by a solver.

- **Live artifact (claude.ai):** https://claude.ai/artifact/81MKYyjjK6y3if68uSxwak
- **Status:** 28 levels, ordered easy to hard. Tap-to-drive, undo, restart, progress saved on the device, light and dark themes.
- **Name:** "Beamline Tank" is deliberately not "LaserTank". The artwork and levels are original; only the rules are borrowed.

## Quick start

```bash
npm run build     # solve all levels, bake in PAR, write docs/ (PWA) and build/artifact.html
npm run solve     # print par + shortest solution for every level (or: npm run solve -- crate)
npm run serve     # serve docs/ on http://localhost:8080
npm run check     # headless smoke test of the PWA (needs: npm i -D playwright)
```

Node 18+ is enough. Nothing needs installing except Playwright for `check`.

## File map

| Path | What it is |
|---|---|
| `src/engine.js` | Pure game rules. No DOM. Shared by the browser and the Node tools. |
| `src/levels.js` | `LEVELS` array (`{name, tip, rows}`), plus `ORIG_NAMES` (used only to migrate old saved progress). |
| `src/ui.js` | Canvas rendering, input, animation, tap-to-drive routing, save/load. |
| `src/shell.html` | Title, fonts, CSS tokens, markup. It has no `<html>/<head>` because the artifact host adds those. |
| `pwa/` | Manifest, service-worker template, icons. Copied into `docs/` by the build. |
| `tools/build.js` | Assembles everything. Fails the build if any level is unsolvable. |
| `tools/lib.js` | Loads engine + levels into Node; BFS `solve(rows)`. |
| `tools/solve.js`, `tools/try.js` | Check the real levels, or a scratch file of candidates. |
| `tools/gen.js`, `prune.js`, `pick.js` | Random level generator → declutter → rank. Produced sectors 21–28. |
| `tools/check.js` | Playwright smoke test (script errors, service worker, offline reload, tap-to-drive). |
| `docs/` | **Build output.** The deployable PWA. Do not edit by hand. |
| `build/artifact.html` | **Build output.** Paste or publish as the claude.ai artifact. |

## Level format

Each level is an array of equal-length strings, one character per cell. Sizes vary; the board scales to fit.

```
#  wall          b  brick (one shot)     B  crate (push; in water → bridge)
.  floor         G  glass (laser passes, tank can't)
~  water         i  ice      t  thin ice (becomes water after you leave it)
F  flag (goal)   T  tank start (faces up)
u r d l  conveyor belt (moves the tank only)
X Y Z    tunnel pairs (two of the same letter)
1 2 3 4  mirror, open sides: 1=up+right 2=right+down 3=down+left 4=left+up
5 6 7 8  rotary mirror, same orientations as 1–4 (spins clockwise when hit on a dull side)
^ > v <  anti-tank facing that way
```

A mirror's open sides are the two faces its bright diagonal looks out of. A beam entering through an open side turns toward the other open side. A beam hitting a dull side pushes the mirror, or spins it if it is a rotary mirror.

## Rules as implemented (`src/engine.js`)

- Actions: `0 1 2 3` = up, right, down, left; `4` = fire. Pressing a direction the tank isn't facing only turns it (this still counts as a move).
- **Laser:** travels from the tank and passes over terrain and glass.
  - Bricks are destroyed.
  - Crates, mirrors and dead anti-tanks are pushed one square.
  - A live anti-tank dies only when hit on its muzzle; a hit from any other side pushes it.
  - A beam that comes back to the tank kills it.
- **Pushed objects:** they slide over ice and thin ice and pass through tunnels if the exit is clear. A crate that lands in water becomes a bridge (`=`); anything else pushed into water sinks. Objects can't enter the flag square.
- **Anti-tanks:** they fire the moment the tank is on their barrel line with nothing in between. Glass doesn't block them. This is checked after every single tank step, so it also catches the tank mid-slide or mid-belt.
- **Rules I chose where I wasn't sure of the original game.** These may differ from classic LaserTank:
  - Dead anti-tanks can still be pushed.
  - Anti-tanks see through glass.
  - Anti-tank shots don't bounce off mirrors.
  - Belts don't move objects.
  - Thin ice ignores objects passing over it.
- `act(state, action, frames)` mutates `state`. When `frames` is an array, it receives a snapshot after each atomic change (with `laser` points on beam frames), and the UI plays these back as animation. The solver passes `null`.

**If you change a rule, run `npm run solve` afterwards.** Every level's solvability and par depend on these rules.

## UI notes (`src/ui.js`)

- **Colors:** every color is a CSS token in `shell.html`. The canvas reads the tokens through `getComputedStyle` and re-reads them when the theme changes.
- **Tap-to-drive:** `route()` runs a breadth-first search using only the four drive actions on cloned states. It therefore respects ice, belts, tunnels and anti-tank fire. It gives up after 40k states and shows a red cross. Tapping the tank fires.
- **Input queue:** tapped routes go into `queue`. Pressing a key or button replaces the queue, which interrupts an auto-drive.
- **Saved progress:** stored in `localStorage` key `blt2` as solved level *names*, so levels can be reordered freely.
- **Artifact leftovers:** `window.claude.hot` calls are for the artifact host and are no-ops in the PWA.

## Adding or changing levels

1. Sketch candidates in `scratch.js` (`module.exports=[{name,rows}]`) and run `node tools/try.js ./scratch.js`.
2. Read the printed solution (`U R D L F`) to spot unintended shortcuts. If one exists, add walls, water or glass to close it and re-run.
3. Add the level to `src/levels.js` at the right difficulty position, with a one-line `tip`.
4. Run `npm run build`.

Par is the minimum number of actions, turns included, so it is a rough difficulty signal. The `states` count from `try.js` is a second one.

To get more hard levels from the generator:

```bash
node tools/gen.js 7 50000 mix > a.jsonl     # themes: mix | at (anti-tank heavy) | ice
cat a.jsonl | node tools/pick.js 10 > picked.jsonl
```

Generated levels are valid but look random. Hand-made levels read better.

## Put it on your phone (PWA)

A PWA needs to be served over HTTPS. The simplest free option is GitHub Pages.

1. Create a GitHub repository and push this folder to it. It is already a git repository.
2. On GitHub, go to Settings → Pages. Under Build and deployment, choose **Deploy from a branch**, select branch `main` and folder `/docs`, then save.
3. After a minute the game is live at `https://<user>.github.io/<repo>/`.
4. Install it:
   - **Android (Chrome):** open the URL, then ⋮ → **Install app** (or **Add to Home screen**).
   - **iPhone (Safari):** open the URL, then Share → **Add to Home Screen**.

After that it opens full screen and works offline. The service worker caches the page, icons and fonts. Each build stamps a new cache version, so after you push an update the phone picks it up the next time the app opens with a connection.

Netlify or Cloudflare Pages also work: point them at the `docs` folder, with no build command.

## Updating the claude.ai artifact

Run `npm run build`, then publish `build/artifact.html` to the artifact URL above. From Claude, ask to update that artifact with the file.

## Ideas / next steps

- **Level editor:** palette, paint the grid, test play, and export the `rows` strings. The solver can run in the browser to validate (it is plain JS).
- **Bigger levels:** full 16×16 maps, like the original.
- **Hand-made hard tier:** replace the generated sectors 21–28 with hand-made puzzles.
- **Feel:** sound effects (start audio from a tap), haptics (`navigator.vibrate`) on death and win.
- **Move history:** show the move history, and add a replay of the shortest solution as a "show me" hint (the solver path is available at build time).
- **Landscape layout:** put the board beside the controls in landscape on phones.
