---
name: release
description: >
  Run Beamline Tank's release sequence: solve, build, smoke test, update the
  docs, commit, push, and open the pull request. Use only when explicitly invoked.
disable-model-invocation: true
---

# Release

Release the change currently in the working tree. If the invoking message has
a summary after `/release`, use it; otherwise derive one from the diff.

Run these steps in order. Stop at the first failure and report it; don't commit.

1. **Base.** `git fetch origin main`. If this branch's previous PR is merged
   and the branch isn't based on the latest `origin/main`, stop: the branch
   must be restarted from `origin/main` first (CLAUDE.md).
2. **Solve.** If `src/engine.js` or `src/levels.js` changed, run `npm run solve`.
   Every level must be solvable. Note any par that changed (old → new) for the PR:
   a rule change that moves the par of a level it wasn't meant to touch is a
   bug until proven otherwise.
3. **Build.** `npm run build`. It rewrites `docs/` and `build/`; commit them with
   the source change. There is no version to bump: the build stamps a new service
   worker cache from a hash of the page.
4. **Docs.** Update whichever of these the change affects:
   - `HANDOVER.md`: rules, level format, file map, level count, commands.
   - `BACKLOG.md`: strike what this closed, add what it opened, record any
     decision Cathal made (including ideas turned down).
   - `CLAUDE.md`: only when a file, command or rule changed.
5. **Checks.** `npm run check` must exit 0 (any change to `src/` or `pwa/`).
   Then read the diff of `src/` and confirm each edit actually landed.
6. **Commit** with a short summary message.
7. **Push** with `git push -u origin <branch>`; on network errors retry up to
   4 times (2s/4s/8s/16s). Never push to `main`.
8. **Test link.** Publish `build/artifact.html` as a *separate* artifact titled
   "Beamline Tank (test)" (reuse this session's test artifact on later pushes;
   never the live URL before merge).
9. **PR.** Open it straight away (or update the open one), base `main`. The API
   doesn't apply `.github/pull_request_template.md`, so fill it in section by section:
   - **Try this version** on the first line: the test artifact link. Then the
     **Live game** link, unchanged.
   - **What changed / Why** in plain English.
   - **Before you merge:** copy the "Always check" boxes unchanged, then write
     2–4 "Check for this change" boxes naming the level, the tap and the result.
     If nothing is visible, say so in one line and name the covering checks.
   - **Checks:** solve result (with par changes), the `npm run check` output,
     and whether `docs/`/`build/` were rebuilt. Say which files under `tools/`
     changed and why, if any did.
10. **Live game.** After Cathal merges, offer to publish `build/artifact.html` to the
   live artifact (HANDOVER.md § Updating the claude.ai artifact).
