# Beamline Tank: backlog

Pending work and decisions on record. Check this before proposing a feature:
it may already be built, planned or turned down. When a PR closes an item, strike it
here in the same PR; record any decision Cathal makes, including "no".

## Ideas / next steps

- **Level editor:** palette, paint the grid, test play, and export the `rows` strings. The solver can run in the browser to validate (it is plain JS).
- **Bigger levels:** full 16×16 maps, like the original.
- **Hand-made hard tier:** replace the generated sectors 21–28 with hand-made puzzles.
- **Feel:** sound effects (start audio from a tap), haptics (`navigator.vibrate`) on death and win.
- **Move history:** show the move history, and add a replay of the shortest solution as a "show me" hint (the solver path is available at build time).
- **Landscape layout:** put the board beside the controls in landscape on phones.

## Decisions on record

- **Name:** "Beamline Tank", deliberately not "LaserTank". Artwork and levels are original; only the rules are borrowed.
- **Rules where the original was unclear** (HANDOVER.md § Rules as implemented): dead anti-tanks can be pushed;
  anti-tanks see through glass; anti-tank shots don't bounce off mirrors; belts don't move objects; thin ice
  ignores objects passing over it. Changing any of these moves pars and can break levels: confirm first.
- **No dependencies at runtime.** Playwright is for the smoke test only.
- **Progress is keyed by level name** (`blt2`), so levels can be reordered freely but not renamed casually.
