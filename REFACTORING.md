# Refactoring findings and proposed approaches

Status: applied to the current application. Use [ARCHITECTURE.md](ARCHITECTURE.md) for the resulting implementation and
the scoped [AGENTS.md](AGENTS.md) files for working conventions. The numbered findings below preserve the original
pre-refactoring review; linked source files now contain the refactored implementation. The recommendations are
project-specific design judgments, supported by the linked framework documentation.

Subsequent personal-library work adds sorting, filters, local edits, saved/status/recent views, and full-catalogue local
projection. The list now cancels obsolete typing delays rather than starting an HTTP request for each search; this is
necessary for browser-edited metadata to participate in matching and ordering. The current behavior and verification
are described in `ARCHITECTURE.md` and `.cursor/context/current-requirement.md`.

## Implementation status

| Area                           | Applied change                                                                                                                                                                       |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Error ownership                | A functional HTTP interceptor, root error handler, shared reporter, expected-404 context, bootstrap fallback, and one runtime notice. Error objects are deduplicated by identity.    |
| Request correctness            | Discriminated request states, a cancellable list query branch containing both delay and HTTP work, immediate clear/retry/page-size changes, and async-pipe teardown.                 |
| Explicit initialization        | `ThemeService.initialize()` runs through `provideAppInitializer`; the shell delegates theme commands without constructor effects.                                                    |
| Templates and reuse            | External page HTML, Angular control-flow blocks, and shared cover, loading, and state-message components.                                                                            |
| Styling                        | Semantic light/dark tokens, shared interaction classes, and snackbar colors using the same palette.                                                                                  |
| Configuration and dependencies | `BOOK_API_URL` is supplied by application configuration. Existing unused packages remain documented workshop options; no new dependency or store/query/SSR migration was introduced. |
| Regression checks              | Shared browser fixtures plus list, error-handling, and theme suites alongside the existing details suite.                                                                            |

Implementation checks are recorded in the final section. The priorities and evidence below describe why these changes
were selected rather than the remaining state of the application.

Fix request correctness and error handling first. Then separate initialization, request state, and presentation so each
has one clear owner. The existing Angular 20, RxJS 7, and Tailwind 4 stack is sufficient for these changes.

## Priorities

| Priority           | Finding                                                                | Recommended direction                                                      |
| ------------------ | ---------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| P1                 | Error handling differs between bootstrap, list, and details            | Centralize reporting and HTTP policy; retain local recovery UI.            |
| P1                 | Search requests can race, and timer/subscription cleanup is missing    | Use one cancellable query pipeline and explicit request state.             |
| P2                 | Theme initialization changes the environment during construction       | Give theme initialization an explicit startup entry point.                 |
| P2                 | Large inline templates mix page composition with repeated UI           | Separate HTML files and extract components with clear responsibilities.    |
| P2                 | Cover, loading, and state-panel behavior is duplicated or inconsistent | Share small presentation components and keep request logic in pages.       |
| P2                 | Repeated palette and interaction classes make changes expensive        | Introduce semantic theme tokens and a few shared interaction styles.       |
| P3                 | API origin and unused dependencies obscure the runtime setup           | Make the endpoint configurable and review dependencies individually.       |
| Supporting P1 work | Existing coverage misses the most fragile behavior                     | Add focused regression checks before changing request and error ownership. |

P1 addresses observable correctness and recovery problems. P2 reduces maintenance cost. P3 can follow independently.

## 1. Define error ownership across the application

**Evidence.** [app.config.ts](src/app/app.config.ts) already registers `provideBrowserGlobalErrorListeners()`, but has
no custom `ErrorHandler` or HTTP interceptors. [main.ts](src/main.ts) logs bootstrap failures directly.
[BookListComponent](src/app/books/book-list.component.ts) logs HTTP failures and clears `loading`; an initial failure can
therefore appear as “No books available,” while a failed search can leave results from an earlier query.
[BookDetailsComponent](src/app/books/book-details.component.ts) instead distinguishes 404 responses from retryable errors.
[ToastService](src/app/shared/toast.service.ts) exists but is unused by both pages.

**Proposed ownership:**

| Failure                                          | Reporting owner                                         | User-facing behavior                                              |
| ------------------------------------------------ | ------------------------------------------------------- | ----------------------------------------------------------------- |
| Detail request returns 404                       | Feature handles the expected outcome                    | Show “Book not found”; provide collection navigation.             |
| Book API network or server failure               | HTTP interceptor reports once through a shared reporter | Page shows an inline error and explicit retry.                    |
| Unexpected Angular or browser error              | Custom root `ErrorHandler` uses the same reporter       | Offer a generic notice only where the UI can still render safely. |
| Bootstrap fails before the application is usable | Final bootstrap rejection handler                       | Preserve a minimal reporting fallback.                            |

Angular's global listeners already forward unhandled browser errors to `ErrorHandler`. A custom handler supplements
local request recovery; caught HTTP errors do not become global errors automatically.
[Angular error handling](https://angular.dev/best-practices/error-handling).

Register the custom handler in `app.config.ts`. Start with a small `ErrorReporter` service and a console-backed reporting
implementation. A functional HTTP interceptor can attach request context, report unexpected API failures, and rethrow the
original error so the page retains its status code and recovery choices.
[Angular HTTP interceptors](https://angular.dev/guide/http/interceptors).

Choose one owner for each report and each notification. A handled detail 404 should not trigger a global snackbar; a
request with an inline error should not also produce a duplicate toast. Keep bootstrap fallback reports deduplicated when
the same failure has already been reported. Avoid converting failed requests to successful empty arrays or applying
automatic retries to every request. An error handler reports failures; it does not restore broken component state.

**Done when:** list failures have a clear retry state, 404 remains a local outcome, request errors still reach the page,
and each failure produces at most one report and one appropriate notification.

## 2. Use one request-state pattern and cancel obsolete searches

**Evidence.** The list holds `books`, `loading`, `searchTerm`, and `searchTimeout: any` separately, calls `subscribe()` for
each load, and debounces with `setTimeout`. Requests are not cancelled or ordered. `clearSearch()` leaves a pending timer
active, and navigating away does not tear down requests or timers. The `pageSize` input does not itself trigger a reload
when changed after initialization. Details already use `switchMap` and the async pipe, but combine a status string with a
nullable book, allowing representable states such as `status: 'ready'` with no book.

Use a single observable view state per routed page. A small discriminated union makes the data available only in the
appropriate branch; a details-only outcome can remain feature-specific:

```ts
type RequestState<T> = { status: 'loading' } | { status: 'ready'; data: T } | { status: 'error'; message: string };

type BookDetailsState = RequestState<Book> | { status: 'not-found' };
```

For the list, an empty result is a successful `ready` state with `data.length === 0`. Adopt a clear policy that a failed
query displays its error instead of presenting earlier results as matches for the new query. If retaining previous data
later becomes a requirement, model and label that explicitly.

Replace manual timers and per-call subscriptions with typed search, clear, retry, and page-size events feeding one
pipeline. Deduplicate equivalent queries; allow retrying the same query after failure. Preserve the 300 ms typing delay,
with initial load, clear, and retry running immediately.

Cancellation must happen when the input changes, including during the debounce interval. Putting `debounceTime(300)`
before `switchMap` leaves the old request active until the delayed value arrives. Instead, switch on raw query events and
place the typing delay inside the replaceable branch. Both its delay and its HTTP request are then obsolete when the next
event arrives. This follows the replacement behavior of
[RxJS 7.8 `switchMap`](https://raw.githubusercontent.com/ReactiveX/rxjs/7.8.0/src/internal/operators/switchMap.ts).

Emit loading/success/error within each request branch; keep `catchError` there so later queries and retries still work.
Avoid a shared loading boolean that a cancelled request's `finalize` can incorrectly clear while a newer request runs.
Subscribe once with the async pipe. Use `takeUntilDestroyed` for imperative subscriptions that remain necessary.

**Done when:** slow old responses cannot overwrite new results, clearing search does not cause a delayed duplicate load,
leaving the page cancels pending work, retries survive errors, and changes to a retained `pageSize` input reload the list.

## 3. Make initialization and environmental side effects explicit

**Evidence.** [App](src/app/app.ts) reads storage and system preferences in its constructor and calls `applyTheme()`, which
mutates `document.documentElement.classList`. Its toggle method also writes browser storage. Constructing the shell
therefore initializes browser-wide state.

The details constructor is different: assembling `state$` does not itself send an HTTP request because the stream is lazy.
However, its `switchMap` callback mutates `coverFailed` when subscribed. The constructors in `BookApiClient` and
`ToastService` only inject dependencies and are not side-effect problems.

Introduce a focused `ThemeService` with an explicit `initialize()` method, a read-only current-theme value, and a
`toggle()` or `setTheme()` command. Invoke initialization through
[`provideAppInitializer`](https://angular.dev/api/core/provideAppInitializer) in `app.config.ts` so startup behavior has an
explicit owner before the shell renders. Keep storage access and document updates behind small, replaceable boundaries.
Moving the same work into a service constructor would preserve the original coupling.

Keep the existing behavior: saved choice takes precedence, the system preference supplies the default, and unavailable
storage does not disable the UI. Initialization should not persist a system-derived default as an explicit user choice.
Avoid deferring theme application until after the view renders, which could introduce a visible theme change.

Pure dependency injection and observable assembly can remain in construction or field initialization. Input-dependent
work should start after inputs are available; lifecycle hooks should delegate to named operations. Move image failure
state into the cover component proposed below so the request pipeline only produces request state.

**Done when:** constructing presentation components does not read storage or change the root theme, initialization has a
single explicit call site, and existing theme persistence and fallback behavior remain intact.

## 4. Set clear boundaries between page logic and templates

**Evidence.** The list and details components embed substantial HTML alongside request logic, SVG markup, conditional
states, and long utility-class lists. The root shell already uses a separate HTML file. Inline templates are valid, but
the larger book templates make request changes and markup changes harder to review independently.

Move the list and details markup into adjacent `*.component.html` files. Then reduce their responsibilities through
composition; relocating the same markup alone does not remove duplication. Keep a small card template inline if it stays
easy to scan. This is a targeted refactor and should be reflected in the current template conventions in
[src/AGENTS.md](src/AGENTS.md) and [ARCHITECTURE.md](ARCHITECTURE.md) when implemented.

Use these boundaries consistently:

| Layer                       | Owns                                                                      |
| --------------------------- | ------------------------------------------------------------------------- |
| API client                  | URLs, query parameters, typed HTTP requests.                              |
| Routed page                 | Route/search inputs, request state, retry commands, page composition.     |
| Presentation component      | Inputs, rendering, local interaction, and output events.                  |
| Theme service               | Theme preference and explicit browser side effects.                       |
| Shared error infrastructure | Reporting and transport policy, with local UI recovery retained by pages. |

Keep templates declarative: bind the view state, render a branch, and delegate events to named handlers. Small expressions
such as an optional subtitle remain readable in HTML. Move repeated or substantial calculations into a pure function or
derived state rather than burying them in bindings. This follows the
[Angular style guide](https://angular.dev/style-guide).

Within the templates being refactored, consider `@if`, `@switch`, and `@for (...; track book.id)` to make state branches
clear and remove the trivial `trackById` wrapper. Keep stable ID tracking and migrate related markup consistently.
[Angular control flow](https://angular.dev/guide/templates/control-flow).

**Done when:** request behavior can be understood without reading SVGs and layout classes, and templates expose state and
actions without constructing requests or performing environmental side effects.

## 5. Extract repeated UI where behavior has already diverged

**Evidence.** List and details implement separate spinners. Cards and details duplicate cover markup and fallback text;
details handle broken cover URLs, while cards handle only missing URLs. The details spinner supplies a status announcement
and reduced-motion behavior, while the list spinner does not. Empty, not-found, and request-error panels repeat layout,
typography, and action styles.

Prioritize these small components:

| Proposed component          | Scope         | Responsibility                                                                                        |
| --------------------------- | ------------- | ----------------------------------------------------------------------------------------------------- |
| `BookCoverComponent`        | Books feature | Render source/alt text, handle missing or failed images, reset failure state when the source changes. |
| `LoadingIndicatorComponent` | Shared UI     | Consistent spinner, message, status announcement, and reduced-motion behavior.                        |
| `StateMessageComponent`     | Shared UI     | Repeated panel layout with page-supplied heading, message, and action content.                        |

Keep HTTP requests and retry commands in their pages. The shared panel should preserve the page's heading hierarchy and
appropriate status/alert semantics. Preserve each cover layout's aspect ratio and size constraints. Leave the four
metadata rows as a semantic `dl`; they do not need four new components just to reduce line count.

**Done when:** card and detail covers share failure handling, loading announcements are consistent, and common panel
markup changes in one place without creating a configurable page-rendering framework.

## 6. Centralize repeated theme and interaction styling

**Evidence.** The templates repeatedly pair colors such as `text-gray-600 dark:text-gray-300` and
`bg-gray-50 dark:bg-gray-900`, along with nearly identical button and focus styles. Every new state requires another
manual palette mapping. [material-theme.scss](src/material-theme.scss) fixes the snackbar container to a light color,
which needs attention if shared error notifications start using it in dark mode.

Define a small semantic palette in [styles.css](src/styles.css): page, surface, muted surface, primary text, secondary
text, divider, and accent. Assign light/dark values once and expose them through Tailwind theme utilities. Reuse a small
set of primary-action and focus styles while keeping layout utilities local. Tailwind's theme variables support custom
utility-backed tokens; see [Tailwind theme variables](https://tailwindcss.com/docs/theme).

Keep the existing document-root `dark` class as the selection mechanism. Align snackbar colors and text contrast with the
same palette when wiring notifications. Validate actual rendered text, borders, focus outlines, and disabled/hover states
in both themes; fewer class names alone do not establish a better design.

**Done when:** changing a shared palette or primary action does not require editing every page template, with preserved
responsive layouts, contrast, and keyboard focus visibility.

## 7. Clarify configuration and dependency usage

**Evidence.** [BookApiClient](src/app/books/book-api-client.service.ts) hardcodes `http://localhost:4730/books`.
[package.json](package.json) declares NgRx, TanStack Query, and SSR/server packages that are not used by the current app.

Inject a `BOOK_API_URL` value supplied by application configuration; keep request construction in the existing client.
This supports deployment-specific endpoints and isolated service checks without introducing another data-access layer.
Preserve URL-encoded IDs, `_limit`/`q` parameters, string IDs/ISBNs, and already formatted price strings.

Review unused packages individually and remove them only after confirming they are unnecessary for the workshop and
build setup. Keep lockfile updates intentional. Component-local RxJS state is sufficient for this application; introduce
a store or query library only when concrete cross-page state or caching requirements justify it.

**Done when:** the backend location is an explicit configuration decision, and declared dependencies accurately reflect
the intended runtime or clearly documented workshop needs.

## 8. Protect the changes with relevant regression coverage

[tests/book-details.spec.ts](tests/book-details.spec.ts) supplies useful mocked browser coverage for navigation, direct
links, reloads, loading, retries, missing books/covers, and a narrow viewport. There is no committed suite for list search,
theme persistence, or reporting ownership. The current Karma target has no source specs or directly declared
Karma/Jasmine dependencies, so `npm test` is not an established validation path.

Use the existing Playwright setup for behavior checks now. Before relying on new service/operator unit tests, make an
explicit decision to complete the unit-test setup. The highest-value regression cases are:

- A slow earlier search response never replaces newer results, including when it arrives during the typing debounce.
- Clear and retry bypass typing delay; retrying an unchanged query works; navigating away cancels pending work.
- Initial list failure and failed search show a recoverable error rather than a successful empty or mismatched result.
- A detail 404 stays local; server/network failures reach the page and are reported once; unhandled errors use the global
  handler. Keep unexpected failures visible to the test runner.
- Both cover locations recover from a failed image and accept a new valid source; loading states announce their message.
- Theme initialization and explicit toggles preserve saved preference precedence, keyboard operation, reload behavior,
  narrow-screen layout, and usability with blocked storage.

## Suggested implementation sequence

1. Add regression coverage for search races, list failures, and error ownership using the available browser tooling.
2. Define the error-reporting boundaries, add the handler/interceptor, and align list/detail request state and retries.
3. Replace the list's timers and independent subscriptions with the cancellable query pipeline.
4. Extract explicit theme initialization and relocate image failure state into the shared cover component.
5. Extract the larger HTML files and repeated presentation components, then introduce the shared color/action tokens.
6. Make the API endpoint configurable and review unused dependencies as separate, focused changes.

For each implementation step, run `npm run build`, the affected Playwright suites, and formatting checks. Preserve
`/books/:id` direct loading, existing API field formats, safe plain-text abstracts, and both color modes. Update
`ARCHITECTURE.md` and scoped guidance when the new boundaries are in place.

## Implementation validation

At completion of the original refactoring, the production build and all 22 checks in its four Chromium suites passed. Browser coverage included the
original details behavior plus request cancellation during debounce, list failure/retry, immediate
clear and unchanged-query retry, navigation teardown, shared cover fallback, expected 404 handling, server/network
failures, runtime report deduplication, and theme initialization/persistence with blocked storage.

Formatting, 83 local documentation links, and whitespace checks passed as well. The browser run used a temporary local
configuration for the installed Chromium; machine-specific paths are not part of committed test configuration. Firefox
and WebKit were not run. The existing Karma scaffold and unused workshop dependencies remain documented separately in
`ARCHITECTURE.md`; they are not prerequisites for the browser suites.

## Angular CLI modernization — 2026-11-12

The installed Angular CLI 20.2.0 MCP server's `get_best_practices` tool supplied
the guide for this explicitly requested application-wide cleanup. The application
retains its Angular version and dependencies. The intentionally flawed, unrouted
review exercises remain separate from production conventions.

- All 12 production components use `OnPush` and the default standalone behavior.
  Component contracts use `input()`/`output()`; synchronous local/derived state
  uses signals, `computed()`, and source-linked writable state where appropriate.
- Collection, details, and editing routes use lazy `loadComponent` imports.
  The unused legacy animation provider was removed. The initial production bundle
  decreased from 445.74 kB to 307.44 kB; route chunks load separately.
- Editing and multi-field filters use typed reactive forms. Validation preserves
  trimmed nonblank titles and positive whole-number page counts; Cancel retains
  an independent draft. Filter synchronization suppresses feedback emissions,
  and its user-change subscription tears down with the component.
- Simple search/status/map controls use native value/event bindings. Existing
  RxJS request composition retains debounce, cancellation, retry, and async-pipe
  ownership. Toast dependencies now use `inject()`.

The baseline production build and 41 Chromium cases passed before edits. The final
production build and all 42 Chromium cases passed, including a new behavior case
for broken-to-valid cover recovery, preserved selection, camera reset on new
matches, and fallback selection after filtering. Existing test assertions and
package manifests/lockfile were preserved. The local runner uses the installed
Chromium; Firefox/WebKit and the incomplete Karma scaffold were not run.

## Creation, pagination, and reading board — 2026-11-13

The requested features reuse the existing editor instead of adding a second form.
The shared form accepts a submit label and Cancel route; only a changed book input
resets its independent draft. Creation and editing resolve local records through
the existing library service, which also owns board status and order. No new store,
HTTP write, dependency, or constructor side effect was introduced.

The collection projection merges local books before applying edits, matching,
filters, and sorting, then clamps/slices a numbered page. Universe and the board
consume all matching books. The obsolete expanding-limit `hasMore` state was
removed. Pagination controls and board interaction have separate component owners.

Critical review found that the first board implementation loaded CDK with every
collection visit. A deferred standalone board now loads inside its selected-tab
branch with loading/error feedback. The collection chunk changed from 102.08 kB
to 32.95 kB, with a separate 69.86 kB board chunk. The final initial bundle is
318.56 kB; shared runtime/chunk splitting means this is not an initial-bundle
reduction relative to the 312.23 kB first feature build.

Screenshot review also caught a cramped add-book selector at 320px despite a
passing horizontal-overflow check. Its controls now stack on small screens.
The board retains native status menus, announcements, semantic theme colors,
reduced-motion handling, and stable ID anchors for filtered drag operations.

The workflow started from 42 passing Chromium cases. All 13 new/amended scenarios
were verified Red before production work, then Green. The complete six-suite
regression run passed all 54 cases without skips or retries. A second complete
library-suite run passed all 17 cases after the final mobile layout change. Build and acceptance evidence
are recorded in the [completed book-workflow brief](.cursor/context/book-workflow-completed.md).

Prepared skills were refined from observed issues: distinguish Already Green work,
scope API monitors to the API origin, wait for CDK animation preview cleanup,
preserve legacy browser state, reuse form/state owners, and reconcile mixed
existing/new requirements. No acceptance assertion was relaxed: the old Show more
case was explicitly superseded by pagination; C1's URL monitor and the drag helper
received documented test-owned corrections.

## Universe in 3D — 2026-11-13

The Universe now uses deterministic X/Y/Z book coordinates and perspective
projection with user-controlled yaw/pitch. Pure layout/projection stays separate
from camera events, selection, templates, and HTTP. Existing query order, grouping,
preview/detail navigation, cover fallback, and full-catalogue matching are retained.
Native rotation/tilt buttons and keyboard orbit complement pointer controls;
Shift-drag/arrows retain panning. Fit all resets the complete camera.

The scene adds a luminous core, spiral dust, orbital paths, depth-scaled stars,
ambient twinkling, and a CSS 3D book preview. Reduced motion stops ambient effects.
Review against 250 live books caught crowded halos; smaller, softer halos and
selected-group labels improve density. Common layout moved to existing theme
utilities, bringing component CSS below its original 4 kB warning budget without
raising limits. No graphics dependency or animation lifecycle was added.

Baseline: ten Universe cases passed. Five new/amended cases were verified Red;
the initial implementation passed all 13 Universe cases. A full-run geometry test
exposed a measurement before async stars existed. An explicit item-count readiness
assertion corrected that test-owned race while preserving its geometry expectations.
The final six-suite run passed all 57 Chromium cases without skips/flaky cases.
The production build passed without warnings; initial bundle 321.55 kB and collection
chunk 42.00 kB. Desktop/rotated/mobile screenshots verified the live 250-book scene.

Prepared test/refactoring references capture the geometry readiness, dense-scene
review, pure projection, keyboard alternatives, and stylesheet budget lessons.
[3D Universe delivery evidence](.cursor/context/universe-3d-completed.md) preserves the
criterion mapping and exact commands. Firefox/WebKit and the incomplete Karma
scaffold remain unverified.

## Angular CLI 21 upgrade — 2026-11-13

The workspace CLI/build now use 21.2.30 with Angular framework/compiler 21.2.26,
Material/CDK 21.2.14, NgRx signals 21.1.1, and toolkit 21.0.1. The official update
command aligned these required peers and regenerated the npm lockfile. Required
migrations completed without changing application source or tests. Existing
Zone.js behavior, Node 24, TypeScript 5.9, and RxJS 7.8 were preserved.

The Angular 20 baseline and Angular 21 final run each passed all 57 Chromium
cases. The verified old development server was stopped before installation and
a new Angular 21 server started for the final run. Production and MCP builds,
component generation, live 250-book loading, and the complete npm dependency-tree
check passed. The final initial bundle is 332.36 kB within the unchanged budgets.
The CLI MCP configuration pins major 21. [Upgrade evidence](.cursor/context/angular-cli21-completed.md)
records scope, commands, versions, and verification limits.

## Signal Forms migration — 2026-11-13

The shared create/edit draft, collection filters, and review example now import
only Signal Forms utilities from `@angular/forms/signals`. Typed signal models
and `form()` replace the legacy form groups/controls. Editor schemas own required
nonblank titles, positive whole pages, and touched/invalid feedback; `FormRoot`
owns submission and duplicate guards. Field-state reset copies changed inputs
without mutating incoming books. Native names/validation attributes are owned
by the field directive rather than duplicated in templates.

Filters use schema range validation and emit copied models from label-level
native events after field updates. Parent input synchronization stays silent;
reset emits once. The previous value-change subscription and teardown plumbing
are removed. Numeric empty values retain null/unbounded semantics. The unrouted
review example's other exercise behavior remains unchanged.

Two useful characterization cases passed before source edits: Enter submission
with touched/cleared fields and clearing individual numeric filter bounds. The
final six-suite run passes all 59 Chromium cases with existing assertions intact.
The strict production build passes within unchanged budgets (336.64 kB initial).
No dependencies or runner configuration changed. Project guidance and the
refactoring skill reference record the Signal Forms pattern and native-attribute
compiler constraints. [Migration evidence](.cursor/context/signal-forms-completed.md)
records the requirement mapping and verification limits.

## Monthly reading recommendation — 2026-11-13

The screenshot-inspired book/star tile uses the existing blue accent, semantic
surfaces, rounded corners, and native keyboard navigation. Its lazy recommendation
route owns catalogue request feedback and composes the shared cover and personal
controls. A pure selector reuses the full merged collection before sorting stable
IDs and selecting by calendar month; filters, page limits, and API order do not
control the monthly feature. Browser edits and created books participate normally.

The cover/metadata/description composition uses actual collection data and shared
fallbacks. Desktop and 320px light/dark screenshots were checked with the live
catalogue. No extra home request, duplicate library state, external retailer data,
or dependency was added. The recommendation chunk is 7.06 kB; build budgets remain
unchanged. Seven new cases were verified Red, then Green. The complete regression
run passed 66 Chromium cases, and a final extended REC2 check verified calendar
rollover. [Feature evidence](.cursor/context/current-requirement.md) records exact
commands and verification limits; prior pending Signal Forms work was preserved.
