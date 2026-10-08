# Beamline Tank — Code Review

**Reviewed:** 8 October 2026  
**Repository:** [coshea321/ubiquitous-memory](https://github.com/coshea321/ubiquitous-memory)  
**Scope:** Static inspection of the `main` branch, including engine, UI, PWA, build process and tests. This review did not include a fresh browser playtest.

## Executive summary

Beamline Tank is a lightweight, installable LaserTank-style puzzle game with 28 levels. The architecture cleanly separates a framework-free engine, level data, rendering, a solver and build tooling. All levels are checked for solvability at build time.

The highest priorities are input and animation reliability and responsiveness of the tap-to-drive search. Automated testing and PWA caching should follow. The findings below distinguish observed code patterns from potential user-visible failures that require reproduction.

## Findings

### P1 — Stale animation callbacks can continue after level navigation

**Files:** [src/ui.js](../../src/ui.js), functions `go()`, `play()`, `doAct()`.

**Evidence:** `play()` uses repeated `setTimeout(next, ...)` callbacks to display animation frames. `go()` changes `S`, `queue`, `view` and `beam` without cancelling or invalidating those callbacks. Level navigation remains available while playback is running.

**Risk:** Frames from the previous level can appear after navigation, while old playback completion callbacks may interfere with the new level.

**Recommended fix:** Introduce an animation generation token or cancellable controller. Invalidate callbacks and reset the playback state whenever a level changes.

**Verification:** Begin a multi-frame animation, switch levels immediately and check that no old snapshots render and that controls remain responsive.

### P1 — Synchronous tap-to-drive search can stall the interface

**Files:** [src/ui.js](../../src/ui.js), functions `route()` and `tapBoard()`.

**Evidence:** `route()` performs breadth-first search on the main browser thread, exploring up to approximately 40,000 visited states. It clones states and copies path arrays at each expansion.

**Risk:** Difficult or unreachable destinations may cause noticeable stalls on phones, especially as larger levels are added.

**Recommended fix:** Make routing cancellable and cooperative, using a Web Worker or bounded asynchronous batches. Include a practical time budget in addition to the state limit.

**Verification:** Profile unreachable destinations and complex maps on a lower-end Android handset.

### P2 — Smoke test has limited behavioural assertions

**File:** [tools/check.js](../../tools/check.js).

**Evidence:** The smoke test checks page script errors, service-worker registration, offline reload and whether a tap produces a nonzero move count. Although it captures the offline title, that value is not explicitly asserted. It does not cover winning, losing, undo, restart, progress persistence or changing levels mid-animation.

**Risk:** Substantial gameplay regressions can pass CI.

**Recommended fix:** Add deterministic engine tests and browser checks for game state, solved levels, undo, restart, persistence and animation interruption. Assert specific expected positions or outcomes rather than only nonzero moves.

### P2 — Service worker may cache error responses and delete unrelated caches

**File:** [pwa/sw.js](../../pwa/sw.js).

**Evidence:** The network-first navigation handler caches fetched responses without first checking `response.ok`. Activation deletes all cache names other than the current `CACHE`, without checking an app-specific prefix.

**Risk:** A fetched error page could replace cached app content; cache cleanup could interfere with other applications on the same origin.

**Recommended fix:** Cache only successful expected application responses. Delete only obsolete caches beginning with the `beamline-` prefix. Add tests for failed navigation, upgrades and offline reload.

### P3 — Canvas layout and accessibility can be improved

**Files:** [src/ui.js](../../src/ui.js), [src/shell.html](../../src/shell.html).

**Evidence:** Canvas cell sizing uses an estimated available height of `innerHeight - 360`. The canvas has an accessible name but does not expose the board state as text.

**Risk:** The layout may be awkward on short or landscape displays, and screen-reader users cannot meaningfully inspect the board.

**Recommended fix:** Use measured or CSS-managed available space; add a landscape layout and accessible game-state descriptions or announcements.

## Strengths to preserve

- Pure engine logic in `src/engine.js`, shared with the Node solver.
- Build-time solvability checks and minimum move calculation for all 28 levels.
- A small, framework-free PWA with offline support.
- Progress saved by level name, allowing levels to be reordered.
- PR template, release instructions, backlog, handover and automated checks.

## Recommended implementation order

1. Fix animation cancellation and add regression coverage.
2. Make tap-to-drive routing responsive and cancellable.
3. Expand behavioural tests for engine and UI.
4. Harden service-worker caching and update handling.
5. Improve viewport behaviour, landscape mode and accessibility.

## Review limitations

This is a static source-code review completed on 8 October 2026. Severity ratings indicate anticipated impact, not confirmed production incidents. Findings requiring runtime reproduction are described as risks. No production gameplay tests or performance benchmarks are claimed.
