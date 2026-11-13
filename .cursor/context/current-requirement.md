# Book editing, creation, pagination, and reading board

Task status: completed — verified working-tree delivery
Definition status: user-defined features and confirmed browser-local creation
Source: user request on 2026-11-13 and answer: Store new books in this browser.
Previous task: [completed Angular modernization](angular-modernization-completed.md).

## User story and scope

As a reader, I want to edit/add books, navigate the collection in pages, and organize
my reading list across Want to read, Currently reading, and Read so I can manage
my collection and reading progress in this browser.

The existing edit form is part of delivery and must be preserved. Creation is
browser-local, as explicitly confirmed. Board state is persisted in localStorage;
drag and drop uses the already installed @angular/cdk. No API writes or accounts.

Delivery choices: reuse the editor fields for creation; add /books/new before the
ID route; use ten books per numbered page with Previous/Next and page selection;
replace the former expanding Show more behavior. Add Reading list as a home tab.
Existing reading-status controls and the board share one state. Persist card order
as well as columns, and provide a native status selector for keyboard/touch use.
These are implementation choices within the requested features, not new user quotes.

## Acceptance criteria and test mapping

E1 — Edit books (existing library.spec.ts edit/persistence, cancel/validation, reload cases).
Given a catalogue or locally created book, when I edit/save or cancel, then valid
saved fields persist under the same ID and Cancel/invalid input leaves it unchanged.

C1 — Create (library.spec.ts [C1]). Given the collection, when I submit a valid new
book, then details, reload, editing, search, and filters work with browser-local data
and no catalogue mutation or single-book API request for the local ID.
C2 — Create validation/cancel ([C2]). Given a new draft, when title/pages are invalid
or I cancel, then no book is created; a valid title and positive whole pages enable Save.
C3 — Stable identities ([C3]). Given two books with equal ISBNs, when created, then
both receive distinct stable IDs and remain distinct after reload.
C4 — Storage failure ([C4]). Given blocked storage, when I create a book, then it
remains usable for the visit and a visible warning explains persistence failure.

P1 — Full collection matching (amended book-list.spec.ts case). Given more than one
page, when I navigate/search, then pages contain the correct slice of all matches.
P2 — Page controls ([P2]). Given 23 books, when I select/advance/return between pages,
then sizes are 10/10/3, bounds are disabled, and no extra catalogue requests occur.
P3 — Query/display ([P3]). Given a later page, when filters/search/sort/view change,
then the page resets; Universe still displays every match independently of paging.
P4 — Shrinking membership ([P4]). Given the last saved-book page, when its last item
is removed, then the visible page clamps to a valid page and renders remaining books.

K1 — Board/status integration ([K1]). Given existing reading statuses including old
stored data, when I open/add/move/remove via native controls, then the three columns,
card membership, other status controls, and reloaded state agree.
K2 — Drag/drop ([K2]). Given a card, when dragged between columns using CDK, then its
status changes once, persists after reload, and no API writes occur.
K3 — Order ([K3]). Given multiple cards, when reordered within a column, then the
new order survives reload without duplicate/lost cards.
K4 — Narrow themes/storage ([K4] light/dark cases). Given a 320px display and blocked
storage, when a book is added/moved, then controls remain usable, the board fits,
and the shared persistence warning is visible.

## Baseline and workflow

Baseline on 2026-11-13: production build passed (307.46 kB initial bundle), all 42
application Chromium cases passed. Existing editor behavior is Already Green.
Karma/Jasmine remains an incomplete scaffold; use the existing Playwright harness.
New scenarios go into existing CI-selected list/library suites. No remote issue
was provided, so issue publication/closure is not applicable. No commit requested.

Workflow: requirements recovery/interview, Red, Green, focused Angular refactoring,
critical delivery review, skill refinements, and local requirements finalisation.

## Red evidence — 2026-11-13

All 13 new/amended UI cases were discovered and failed on the running baseline:
P1–P4 lack page controls; C1–C4 lack Add/Create form controls; K1–K4 lack the
Reading list tab. There were no harness/report errors. Existing editing cases
were Already Green in the 42-case baseline. The former Show more assertion was
explicitly superseded by P1's real pagination expectation.

Before production changes, C1's API monitor was corrected to match the API origin
and /local- path, so ordinary frontend document navigations are not treated as
single-book API calls. This preserves its stated API-boundary criterion.

## Green and Refactor evidence — 2026-11-13

Creation shares the existing typed editor; local UUID records merge into every
collection projection and resolve directly for details/editing. Numbered gallery
pages replace Show more. The CDK reading board shares the existing library status
state, persists column order, and supports native status changes. Storage parsing
keeps old records and derives missing column order from old statuses.

The focused 13-case run initially passed 12 cases. K2's second drag encountered
three transient handles from CDK's source/placeholder/animated preview. The helper
now waits for the preview to detach after mouse release. It still performs both
real pointer drags, verifies the destination and reload, and asserts no API writes.
No retry/timeout increase or assertion removal was used to obtain Green. All 13
then passed with normal timeouts, followed by the full 54-case regression run.

Refactor/review: removed unused `hasMore`, removed an unnecessary non-null assertion,
and deferred the standalone board/CDK until its tab opens. Mobile screenshot review
found a narrow add selector despite no overflow; its controls now stack at 320px.
Shared validation, independent drafts, read-only HTTP, and other feature behavior
are preserved. The final production build passed strict template checks; initial
bundle 318.56 kB, collection chunk 32.95 kB, deferred board chunk 69.86 kB.

## Acceptance reconciliation

| Criterion | Implementation                                                                               | Verification                                                             | Result                                                       |
| --------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------ |
| E1        | Existing shared editor and local override service; local record lookup added                 | Existing edit, cancel/validation, direct reload tests plus C1            | Verified; existing behavior was Already Green                |
| C1        | `/books/new`, shared form, local UUID records, merged projection, local-first details/editor | library `[C1]`: create/reload/edit/search/filter and API monitor         | Verified                                                     |
| C2        | Shared nonblank title/whole positive pages validation; Cancel route                          | library `[C2]`                                                           | Verified                                                     |
| C3        | UUID identity independent of ISBN; compatible stored records                                 | library `[C3]`: two creations, distinct routes, reload                   | Verified                                                     |
| C4        | In-memory state retained with shared storage warning                                         | library `[C4]`                                                           | Verified                                                     |
| P1        | Merge/match/sort before slicing                                                              | list `[P1]`                                                              | Verified; former Show more expectation explicitly superseded |
| P2        | Ten-book pages, bounded controls, native page selection                                      | list `[P2]`: 10/10/3, navigation and GET count                           | Verified                                                     |
| P3        | Query changes reset page; display changes preserve query; Universe gets all matches          | list `[P3]`, existing filters/views tests, inspection of reset commands  | Verified                                                     |
| P4        | Projection clamps page after membership shrinks                                              | list `[P4]`                                                              | Verified                                                     |
| K1        | Compatible parser, shared statuses/order, add/native move/remove                             | library `[K1]`: legacy shape, tab keyboard End, status sync, reload      | Verified                                                     |
| K2        | CDK handle/drop events, atomic service status/order command                                  | library `[K2]`: two real cross-column pointer drags, reload, API monitor | Verified                                                     |
| K3        | Stable ID anchor insertion and deduplicated stored order                                     | library `[K3]`: reorder and reload                                       | Verified                                                     |
| K4        | Responsive columns/controls, semantic themes, native controls, storage warning               | library `[K4]` light/dark at 320px, screenshots                          | Verified                                                     |

## Commands and delivery state

Commands ran from the repository root. The temporary local Playwright override
selects an already installed Chromium binary and writes structured reports;
machine-specific paths are not part of committed configuration.

```powershell
# Baseline and complete final regression scope (42 baseline / 54 final)
node node_modules/@playwright/test/cli.js test tests/book-details.spec.ts tests/book-list.spec.ts tests/error-handling.spec.ts tests/theme.spec.ts tests/library.spec.ts tests/universe.spec.ts --config=tmp/playwright.universe.config.ts --project=chromium --workers=1

# Verified Red: 13 discovered / 13 missing-behavior failures
node node_modules/@playwright/test/cli.js test tests/book-list.spec.ts tests/library.spec.ts --grep "\[(C|P|K)" --config=tmp/playwright.universe.config.ts --project=chromium --workers=1 --timeout=7000

# Focused Green: 13 passed; normal configured timeouts
node node_modules/@playwright/test/cli.js test tests/book-list.spec.ts tests/library.spec.ts --grep "\[(C|P|K)" --config=tmp/playwright.universe.config.ts --project=chromium --workers=1

# Final mobile refinement: complete affected library suite
node node_modules/@playwright/test/cli.js test tests/library.spec.ts --config=tmp/playwright.universe.config.ts --project=chromium --workers=1

npm run build
```

Full regression result: 54 passed, zero failed/skipped/flaky, exit 0, structured
report errors empty (46.0 seconds). The existing console reporter diagnostic
`step id not found: fixture@72` also occurred in the baseline; it did not fail a
case or appear in structured errors. The Red command's shorter timeout was used
only to establish missing controls before implementation.

After the final mobile-only layout change, all 17 library cases passed again
(18.6 seconds, zero failures/skips/flaky, exit 0, structured errors empty). The
remaining full-suite evidence applies to unchanged behavior. Final light/dark
320px screenshots confirm the stacked selector and button remain readable.
Production build and changed-file Prettier checks passed. A Node check using the
installed YAML parser validated all five involved skill entrypoints and 152 local
links across 13 Markdown files; `git diff --check` passed.

Local evidence: `tmp/book-workflow-baseline-results.json`,
`tmp/book-workflow-red-results.json`, `tmp/book-workflow-green-focused-results.json`,
`tmp/book-workflow-final-results.json`, and `tmp/book-workflow-final-library-results.json`. These ignored reports are session
artifacts; committed tests and commands are the reproducible evidence.

Verification limits: API responses were mocked; no live API integration or paid
model calls. Chromium only; Firefox/WebKit were not run. Karma/Jasmine still lacks
an operational unit harness. Skill-creator's Python validator was unavailable on
this machine; use the installed YAML parser for frontmatter and relative-link checks.

Delivery boundary is a verified working-tree change, based on commit
`6fe5aea96afc3a6d3e40e1fb1505260366d2c86d`. No GitHub issue was supplied, so issue
updates/closure are not applicable. No commit, push, PR, or deployment was requested.
