# Universe in 3D

Task status: completed — verified local delivery
Source: user request on 2026-11-13: make my universe 3d and more impressive looking.
Previous delivery: [book workflow](book-workflow-completed.md), preserved as completed.

As a reader, I want to explore my books as a striking, interactive 3D galaxy so
that discovering books feels spatial and engaging.

The user authorizes the visual/interaction implementation. Delivery choices are
perspective-projected 3D coordinates, pointer orbit, native rotation/tilt controls,
a luminous core, nebula/dust/orbital layers, and a richer preview. Reuse Angular
and SVG without a graphics dependency or external image assets. This supersedes
flat background dragging with orbit; Shift-drag retains panning. Existing book
selection, grouping, search, full-match collection, zoom/Fit all, detail links,
keyboard star navigation, themes, and mobile usability remain accepted behavior.

## Acceptance and verification

- 3D1: Given matching books, when I rotate the galaxy, then star positions and
  apparent sizes change with perspective depth, book identities/count remain
  intact, and Fit all returns the camera to its overview. New Playwright case.
- 3D2: Given the 3D map, when I drag or use arrow keys/native rotation/tilt buttons,
  then the camera orbits, selecting books still works, and a grouping change
  resets the camera. New Playwright case plus existing SM4/SM5 checks.
- 3D3: Given reduced-motion preference, when I explore the map, then decorative
  animation is stopped while native controls still work. New Playwright case.
- 3D4: Given a 320px display in either theme, when I rotate/select/zoom/reset,
  then the map, controls, and preview remain usable without horizontal overflow.
  Extend existing SM6 mobile checks without removing their assertions.
- 3D5: Given the revised view, then the visual design communicates a luminous
  galaxy with layered stars/dust, core, orbits, selection, and a readable preview.
  Desktop/mobile screenshot review with the live 250-book catalogue and fixtures.

Existing SM1–SM6 cases establish preserved behavior. Jasmine/Karma has no working
unit harness; use the established Playwright suites and strict production build.
No API/storage changes, new dependencies, remote issue, publication, or commit.

Baseline: all ten existing Universe Chromium cases passed before source changes
(13.2 seconds).

## Red → Green → visual review

All five new/amended cases were verified Red before production changes: the two
320px cases lacked Rotate controls, 3D1 found no perspective size variation, and
3D2/3D3 lacked orientation/rotation controls. The runner reported no infrastructure
errors. The Red command used a five-second timeout only to discover missing UI.

The first implementation passed all 13 Universe cases. World layout and projection
remain pure; camera, grouping, and selection use the existing signals/component.
Rendering adds procedural depth, spiral dust, background stars, core and orbital
paths; native controls and the shared cover/details navigation remain intact.

Desktop/live-catalogue review found crowded halos; lower-intensity/smaller halos
now leave dense groups clearer. Common layout moved to existing Tailwind/theme
utilities, resolving a 6.70 kB component-style warning without raising budgets.
The final production build passes without warnings: 321.55 kB initial bundle,
42.00 kB collection chunk. Packages, lockfile, and build configuration are unchanged.

The first full run passed 56/57 cases. New 3D1 used `evaluateAll` before async
catalogue loading finished, producing an empty measurement array. It now asserts
the required item count before measuring; size/position/reset assertions remain
unchanged. No timeout/retry increase or skips were used to hide failures. The
test-pattern reference records this synchronization lesson; refactoring guidance
records spatial geometry, dense-data visual review, and stylesheet budget lessons.

## Delivery reconciliation

| Criterion | Implementation/verification                                                                             | Status                     |
| --------- | ------------------------------------------------------------------------------------------------------- | -------------------------- |
| 3D1       | 3D coordinates + yaw/pitch perspective divide; `[3D1]` geometry/reset and existing SM4 pointer geometry | Verified                   |
| 3D2       | Pointer orbit, native rotate/tilt, keyboard arrows, bounded pitch/yaw; `[3D2]` and SM3–SM5              | Verified                   |
| 3D3       | CSS reduced-motion override; `[3D3]` checks no running ambient animations and usable controls           | Verified                   |
| 3D4       | Native controls, responsive layout and full preview; both amended SM6 cases                             | Verified                   |
| 3D5       | Desktop, rotated, 320px light/dark screenshots from live 250-book API; less crowded halos reviewed      | Verified visual/live check |

## Reproducible checks and limits

```powershell
# Baseline: 10 cases; final Universe suite: 13 cases
node node_modules/@playwright/test/cli.js test tests/universe.spec.ts --config=tmp/playwright.universe.config.ts --project=chromium --workers=1

# Red: all five discovered cases failed for missing behavior
node node_modules/@playwright/test/cli.js test tests/universe.spec.ts --grep "\[3D|SM6: map controls" --config=tmp/playwright.universe.config.ts --project=chromium --workers=1 --timeout=5000

# Final full regression scope
node node_modules/@playwright/test/cli.js test tests/book-details.spec.ts tests/book-list.spec.ts tests/error-handling.spec.ts tests/theme.spec.ts tests/library.spec.ts tests/universe.spec.ts --config=tmp/playwright.universe.config.ts --project=chromium --workers=1

npm run build
```

Final regression: 57 discovered and passed, zero failed/skipped/flaky, exit 0,
structured errors empty (50.9 seconds). No original assertion was removed or
weakened. Three cases were added; both existing mobile cases additionally exercise
rotation. Final production build passed with no budget warning. Changed-file
Prettier, local Markdown links/skill frontmatter, and `git diff --check` are the
final documentation checks.

The temporary runner selects this machine's installed Chromium. Portable committed
configuration is unchanged. Mocked application cases establish feature regressions;
`node tmp/preview-universe-3d.cjs` separately verified the real API's 250 books,
captured all four screenshots, and checked 320px overflow in both themes. Ignored
artifacts: `tmp/universe-3d-red-results.json`, `tmp/universe-3d-final-results.json`, `tmp/universe-3d-desktop.png`,
`tmp/universe-3d-rotated.png`, and `tmp/universe-3d-mobile-{light,dark}.png`.

Firefox/WebKit and the incomplete Jasmine/Karma scaffold were not run. The
existing Playwright console reporter diagnostic `step id not found: fixture@72`
also occurs in earlier suites; structured results distinguish errors/case status.
This delivery is local working-tree code based on revision
`d9be7237a319df4fc4193defe577fdeef1414003`. No issue number was supplied, so GitHub
updates/closure are not applicable. No commit, push, PR, or deployment is implied.
