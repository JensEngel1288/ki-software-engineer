# Playwright test guidance

Applies only to `tests/` and its descendants, including future `specs/`, `pages/`, `fixtures/`, `utils/`, and `bdd/`
folders. Inherit [repository guidance](../AGENTS.md). [playwright.config.ts](../playwright.config.ts) uses `tests/`,
not `e2e/`; keep that discovery boundary unless a test-layout migration is explicitly requested.

## Requirements and scenario design

- Connect each scenario to the active acceptance criterion and retain its requirement ID in the test title.
  Follow the repository's Red/Green/refactoring skills; a new Red test is expected to fail for missing behavior.
- Group related scenarios with `test.describe`. Express Given/When/Then through readable names, comments, or
  `test.step` blocks. Use ordinary Playwright TypeScript by default. Gherkin/step definitions require a separately
  requested and configured integration; do not add inert `.feature` files or another runner.
- Prefer one spec per feature or route for new work, with cross-route journeys grouped where useful. Preserve existing
  suite organization and coverage. Add optional helper folders only when used; do not relocate working specs as cleanup.
- Derive journeys from actual routes and navigation. Cover relevant happy paths, validation, empty/loading/error/retry
  states, direct links, and persistence. Include keyboard/mobile/themes when affected. BookMonkey has no sign-in or
  authorization model; add authorization scenarios only for an agreed feature that introduces one.
- For book-list changes, cover initial rendering, literal title matching, clearing back to all matches, empty matches,
  and catalogue errors. Preserve the one-character prefix versus longer substring search contract and pagination.

## Page Objects and selectors

- Use a Page Object when locators/actions are shared or a journey is complex. Keep one cohesive page/feature class per
  file, such as `pages/books.page.ts`, receiving the test's `Page`. Expose typed `Locator`s and meaningful actions;
  keep scenario outcomes visible in the spec. Avoid a universal base page or wrappers for every individual click.
- Prefer `getByRole` with accessible names and `getByLabel` for user controls. Use `getByTestId` for stable structural
  or graphical targets that lack a useful accessible locator. Avoid styling classes, long DOM paths, and positional
  selectors that hide ambiguous matches. Scope locators to the relevant card, article, dialog, or region.
- Propose deliberate hooks such as `books-list`, `book-item`, `book-search`, and `add-book` where necessary; these are
  proposed IDs, not existing attributes. Repeated `book-item` hooks should be scoped by title or stable record identity.
  Add hooks during authorized source implementation; Red scaffolding must not edit production just to add selectors.
- Assert observable outcomes with retrying `toBeVisible`, `toHaveText`/`toContainText`, `toHaveURL`, `toHaveCount`,
  `toHaveValue`, and enabled/disabled checks as appropriate. Do not limit coverage to an arbitrary assertion whitelist.

## Fixtures and determinism

- Import `test`, `expect`, `appUrl`, `book`, and `mockBooks` from [book-fixtures.ts](book-fixtures.ts) as needed.
  Its test-scoped page intercepts API/cover requests. Page Objects must reuse that page rather than silently creating
  an unmocked browser/context. Nested specs must adjust relative imports.
- Keep each test independently runnable and safe under configured parallelism. Control API data and errors through
  fixtures, not a running external API, and never mock the application's own filtering/save commands.
- Use fresh browser storage. Seed it only for an explicit starting-state or migration scenario; create changes through
  the UI and reload to verify persistence. Do not overwrite the saved result on every navigation.
- Freeze the clock for monthly/date-dependent behavior. Await explicit loading/ready conditions and locator assertions;
  do not use fixed sleeps or `networkidle` as a substitute for UI readiness. Wait for expected counts before geometry
  measurements and for CDK preview cleanup between real pointer drags. See [test patterns](../.cursor/skills/tdd-red/references/test-patterns.md).

## Execution and delivery

- Run commands from the repository root. Playwright starts/reuses the frontend; mocked application tests need no live
  book API. Install the matching Chromium with `npx playwright install chromium` if needed; keep executable paths portable.
- CI currently names six root-level application specs explicitly. When adding a spec, ensure both local discovery and
  CI selection include it. Nested files being discoverable does not prove that CI executes them.
- Run the affected spec with `npx playwright test tests/<feature>.spec.ts --project=chromium`, then the relevant complete
  application suites required by root guidance. Build when production/configuration changes. For this file alone,
  formatting, links, and consistency/discovery checks suffice.
- Review failures, traces/screenshots, and the configured HTML report (`npx playwright show-report`). Report exact
  commands, browsers, discovered/passed/failed/skipped counts, and limitations. External `example.spec.ts` is a demo;
  exclude it from claims about application coverage.
- Deliver runnable specs plus any used Page Objects/fixtures, proposed or added hooks, and requirement coverage.
  A Green handoff needs observed passing results; Red needs genuine failure evidence. Do not claim passes from code
  generation or discovery alone, weaken assertions, add skips, or increase retries/timeouts to conceal failures.

These conventions follow [Playwright best practices](https://playwright.dev/docs/best-practices) and its
[Page Object guidance](https://playwright.dev/docs/pom), adapted to this repository's existing harness.
