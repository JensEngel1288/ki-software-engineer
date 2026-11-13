# Monthly reading recommendation

Task status: completed — verified local recommendation feature
Source: user request on 2026-11-13 with a book/star recommendation tile and monthly
book feature screenshot. Confirmed: feature a book from the current collection.
Previous delivery: [Signal Forms migration](signal-forms-completed.md).

As a reader, I want a recommendation shortcut on the home page that opens a
featured book from my collection, styled consistently with BookMonkey.

Use the screenshots for the book/star motif and cover-plus-editorial layout.
Adapt them to the existing blue accent, rounded surfaces, English UI, and themes.
Use actual book fields and existing save/status/detail actions. No invented
ratings/reviews/formats, external retailer data, checkout, or new dependency.

Delivery choices: a native recommendation link styled as a tile, a lazy
`/recommendation` route, and a deterministic monthly pick from all merged local/
API records (stable IDs sorted, month index modulo book count). The pick is
independent of gallery pages, filters, and API order; local edits are applied.
The month uses the browser's local calendar. The route loads the catalogue only
on opening/retry; the home shortcut needs no additional request.

## Acceptance and mapping (tests/book-list.spec.ts)

- REC1: Given home, when the book/star tile is activated by keyboard, then the
  monthly view opens with real cover/title/author/metadata/price/description and
  a stable details link; Back to books returns home.
- REC2: Given hidden/filtered and locally edited books, when opening/reloading the
  recommendation with API records reordered, then the month's ID remains stable,
  the pick uses the full collection, and edited metadata is shown. A calendar
  change advances the pick according to the stated monthly selection rule.
- REC3: Given an empty API and a browser-created book, then it can be recommended,
  reloaded, and opened through its local details route with appropriate fallbacks.
- REC4: Given a catalogue failure or empty collection, then retry/error/empty UI
  is usable and Add book remains reachable.
- REC5: Given a delayed catalogue response, then loading feedback appears and
  resolves to the featured book.
- REC6: Given 320px light/dark mode, then the tile and feature fit, cover/description
  fallbacks work, save/status actions persist across reload, and no API writes occur.

Baseline: the immediately preceding valid working tree passed 59 Chromium cases
and the strict build. Preserve all pending Signal Forms work. Add the new cases
to the existing CI-selected list suite, verify Red before production, implement,
review screenshots, and run the complete application/build/formatting checks.
No issue, commit, push, or deployment was requested.

## Red/Green and delivery evidence

All seven new cases were discovered and failed before source changes, for the
absent shortcut/route/view. The app and fixtures ran and structured runner errors
were empty. The five-second Red timeout was only for detecting missing behavior;
Green/final runs used normal timeouts and no retries/skips were added.

Implementation adds one route component with adjacent HTML, one pure selection
helper, and the home tile. It reuses shared cover/feedback/personal controls and
the existing collection projection. No source form code, package, lockfile, or
test configuration from the preceding delivery was replaced. Existing assertions
remain intact; seven cases were added to the existing CI-selected list suite.

The icon test's broad SVG locator was narrowed to the first SVG because the tile
contains the main book/star icon plus the reference's chevron. Its icon visibility
assertion remains. All seven focused cases then passed (7.3 seconds).

The complete application run passed all 66 cases (58.4 seconds), zero failed,
skipped, or flaky, exit 0, structured errors empty. After that run, REC2 gained
calendar-rollover assertions and passed again (2.6 seconds). The other 65 cases
and application source were unchanged, so that passing full-suite evidence remains
valid. Production build passed without budget warnings: 340.04 kB initial and
7.06 kB lazy recommendation chunk.

## Acceptance reconciliation

| Criterion | Evidence                                                                                                            | Result   |
| --------- | ------------------------------------------------------------------------------------------------------------------- | -------- |
| REC1      | Native SVG tile/RouterLink, keyboard activation, real feature fields, details/back links; REC1 UI case              | Verified |
| REC2      | Pure ID/month selection over full merged records; edits/order/search and November→December checks in REC2           | Verified |
| REC3      | UI-created local record with empty API, reload, local detail route, price/description fallbacks; REC3               | Verified |
| REC4      | Page-owned retry/error/empty UI and Add book route; REC4                                                            | Verified |
| REC5      | Loading feedback and async catalogue resolution; REC5                                                               | Verified |
| REC6      | Both 320px themes, fallbacks, saved/status persistence, read-only HTTP checks; two REC6 cases plus live screenshots | Verified |

## Commands and verification limits

```powershell
# Red: seven discovered / seven missing-feature failures
node node_modules/@playwright/test/cli.js test tests/book-list.spec.ts --grep "\[REC" --config=tmp/playwright.universe.config.ts --project=chromium --workers=1 --timeout=5000

# Focused Green: seven passed
node node_modules/@playwright/test/cli.js test tests/book-list.spec.ts --grep "\[REC" --config=tmp/playwright.universe.config.ts --project=chromium --workers=1

# Full application: 66 passed
node node_modules/@playwright/test/cli.js test tests/book-details.spec.ts tests/book-list.spec.ts tests/error-handling.spec.ts tests/theme.spec.ts tests/library.spec.ts tests/universe.spec.ts --config=tmp/playwright.universe.config.ts --project=chromium --workers=1

# Final extended month-rollover case: one passed
node node_modules/@playwright/test/cli.js test tests/book-list.spec.ts --grep "\[REC2\]" --config=tmp/playwright.universe.config.ts --project=chromium --workers=1

npm run build
node tmp/preview-recommendation.cjs
```

The temporary browser override uses the locally installed Chromium executable;
committed configuration is portable. Application cases use intercepted API/cover
fixtures; separate live visual checks captured the home tile and featured
Programming the Mobile Web from the 250-book catalogue, at desktop and 320px in
both themes, with no horizontal overflow. The chosen title is catalogue/month
dependent, not hardcoded. Covers/descriptions are actual source data.

Ignored session evidence: `tmp/recommendation-{red,focused,final}-results.json`,
`tmp/recommendation-desktop.png`, `tmp/recommendation-home-desktop.png`, and
`tmp/recommendation-{home-,}mobile-{light,dark}.png`. Final calendar evidence is
recorded separately. Firefox/WebKit and the incomplete Karma/Jasmine scaffold
were not run. The pre-existing console reporter diagnostic `step id not found:
fixture@72` does not appear in structured errors and did not fail any case.

Delivery is working-tree changes, including preserved pending Signal Forms work.
No GitHub issue or remote publication applies. Final checks: touched-file Prettier,
relative Markdown links, source/route review, and `git diff --check`.

## Icon follow-up — 2026-11-13

The user requested a different recommendation icon, motivated by avoiding reuse
of the screenshot's design. This explicitly supersedes the original book/star
motif. Replace it with a custom, code-drawn compass: concentric rings, cardinal
ticks, and a two-tone needle. Preserve currentColor theme styling, decorative
accessibility semantics, tile layout, label, and destination. This is a visual
amendment to the completed recommendation feature.

Verification: production build and all seven recommendation Chromium cases passed
(10.4 seconds), including keyboard activation and both mobile themes. Touched-file
Prettier and `git diff --check` passed. No tests or dependencies changed.

### Corrected icon direction

The user's follow-up requires a book with a star. Replace the compass with a
distinct open-book drawing and four-point sparkles, keeping the current theme,
tile layout, accessibility, and destination. This supersedes the compass choice.

Verified: production build and all seven recommendation Chromium cases passed
(7.2 seconds). No tests or dependencies changed.
