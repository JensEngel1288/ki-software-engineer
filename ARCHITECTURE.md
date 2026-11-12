# Application architecture

BookMonkey is a browser-rendered Angular application for browsing, searching, sorting, filtering, and organizing a book collection, with browser-local book editing, personal lists, and a persistent light/dark preference. This document describes the implementation in this repository, including the difference between dependencies used by the application and packages declared for capabilities that are not currently implemented.

## Tech stack and dependencies

Versions below are the declarations in [package.json](./package.json). [package-lock.json](./package-lock.json) records the resolved dependency tree; a leading `^` denotes a version range rather than an exact pin.

### Application dependencies in use

| Dependency                                                                           | Declared version    | Role in this application                                                                                                                             |
| ------------------------------------------------------------------------------------ | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@angular/core`, `@angular/common`, `@angular/compiler`, `@angular/platform-browser` | `20.2.1`            | Components, dependency injection, common template directives, template compilation, browser bootstrap, and `HttpClient` from `@angular/common/http`. |
| `@angular/router`                                                                    | `20.2.1`            | Displays the book list and book details in the root router outlet and redirects unknown URLs to the home route.                                      |
| `@angular/forms`                                                                     | `20.2.1`            | Typed reactive forms for collection filters and validated independent editing drafts. Single-action controls use native value/event bindings.        |
| `rxjs`                                                                               | `7.8.0`             | Supplies typed API and view-state streams, cancels obsolete searches and route requests, and coordinates retries.                                    |
| `zone.js`                                                                            | `0.15.0`            | Loaded as a polyfill; zone-based change detection is configured with event coalescing.                                                               |
| `@angular/material`, `@angular/cdk`                                                  | `^20.2.0`, `20.2.0` | Material snackbar support in `ToastService`, with CDK as supporting UI infrastructure. The current book screen does not call the toast service.      |
| `tslib`                                                                              | `2.3.0`             | Runtime helpers for TypeScript compilation; `importHelpers` is enabled.                                                                              |

### Development and styling dependencies

| Dependency                            | Declared version      | Purpose                                                                                                                     |
| ------------------------------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `typescript`                          | `5.9.2`               | Application language with strict type checking and an ES2022 target.                                                        |
| `@angular/cli`, `@angular/build`      | `20.2.0`              | CLI commands, application builds, and the development server.                                                               |
| `@angular/compiler-cli`               | `20.2.1`              | Angular compilation and template type checking.                                                                             |
| `tailwindcss`, `@tailwindcss/postcss` | `4.1.12`              | Utility classes for layout, responsive book cards, colors, and loading indicators.                                          |
| `postcss`                             | `8.5.6`               | Runs the Tailwind plugin configured in [.postcssrc.json](./.postcssrc.json).                                                |
| `prettier`                            | `3.6.2`               | Formatting configured in [.prettierrc](./.prettierrc), including Angular HTML parsing.                                      |
| `@playwright/test`                    | `^1.55.0`             | Browser test infrastructure for Chromium, Firefox, and WebKit, including book details tests with intercepted API responses. |
| `@types/node`, `@types/express`       | `^20.17.19`, `^5.0.1` | Type definitions for Node tooling and Express-related code.                                                                 |

### Additional declared dependencies

`@angular/animations` remains declared for the workshop but has no application provider or animation triggers.
Application transitions use CSS; the unused legacy animation provider has been removed.

| Dependency                                            | Declared version            | Current integration                                                                                            |
| ----------------------------------------------------- | --------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `@ngrx/signals`                                       | `20.0.1`                    | No Signal Store is defined or used in the current source.                                                      |
| `@angular-architects/ngrx-toolkit`                    | `^20.1.0`                   | No toolkit integration is present.                                                                             |
| `@tanstack/angular-query-experimental`                | `^5.85.5`                   | No query client provider or query hooks are used; HTTP subscriptions are handled directly by the component.    |
| `@angular/platform-server`, `@angular/ssr`, `express` | `20.2.1`, `20.2.1`, `5.1.0` | No server entry point or SSR build configuration is present. The configured application starts in the browser. |

## Structure and responsibilities

The application uses standalone components and application-level providers, with no application `NgModule`.
Routed pages own query/route state and compose small presentation components. HTTP, reporting, and theme effects have
separate owners.

| File or directory                                                                                                                                        | Responsibility                                                                                                                                                        |
| -------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [src/main.ts](src/main.ts)                                                                                                                               | Bootstraps the app and reports bootstrap failures through the same deduplication function used at runtime.                                                            |
| [app.config.ts](src/app/app.config.ts)                                                                                                                   | Routing, API URL, HTTP error infrastructure, zone change detection, and explicit theme/library initializers.                                                          |
| [app.ts](src/app/app.ts), [app.html](src/app/app.html), [app.css](src/app/app.css)                                                                       | Root shell with the theme switch, unexpected-error notice, router outlet, and footer. The component class only injects services.                                      |
| [app.routes.ts](src/app/app.routes.ts)                                                                                                                   | Lazy component routes for collection, details, and `/books/:id/edit`, with the wildcard redirect last.                                                                |
| [book-list.component.ts](src/app/books/book-list.component.ts), [HTML](src/app/books/book-list.component.html)                                           | Loads the full catalogue, combines browser-local state and debounced queries, and renders a limited, extendable result set.                                           |
| [book-details.component.ts](src/app/books/book-details.component.ts), [HTML](src/app/books/book-details.component.html)                                  | Loads a book by route ID, applies local edits, records successful views, and exposes saved/status controls.                                                           |
| [book-item.component.ts](src/app/books/book-item.component.ts)                                                                                           | Presents a book, links to details/editing, and emits saved/status actions through shared personal controls.                                                           |
| [book-cover.component.ts](src/app/books/book-cover.component.ts)                                                                                         | Shared card/detail cover rendering, missing/broken-image fallback, and local failure reset when the source changes.                                                   |
| [book-api-client.service.ts](src/app/books/book-api-client.service.ts), [book-api.config.ts](src/app/books/book-api.config.ts)                           | Read-only HTTP access to the full base catalogue and individual books using an injected API URL and expected-404 context.                                             |
| [book.ts](src/app/books/book.ts), [request-state.ts](src/app/books/request-state.ts)                                                                     | Shared book model and discriminated loading/ready/error state; details extend the union with not-found.                                                               |
| [book-library.service.ts](src/app/books/book-library.service.ts), [book-library.ts](src/app/books/book-library.ts)                                       | Explicit startup loading and validation of local saved IDs, reading statuses, recent history, and book edits; command-based persistence with visible failure notices. |
| [book-collection.ts](src/app/books/book-collection.ts)                                                                                                   | Pure projection: apply local edits, match titles, combine filters/view membership, sort, then limit visible results.                                                  |
| [book-filters.component.ts](src/app/books/book-filters.component.ts), [HTML](src/app/books/book-filters.component.html)                                  | Controlled sorting/filter UI that emits changes and reports invalid page ranges.                                                                                      |
| [book-library-controls.component.ts](src/app/books/book-library-controls.component.ts)                                                                   | Reusable save/unsave and reading-status controls for cards and details.                                                                                               |
| [book-edit.component.ts](src/app/books/book-edit.component.ts), [HTML](src/app/books/book-edit.component.html)                                           | Direct-linkable editor route; loads the original book, supplies local overrides, and saves changes through the library service.                                       |
| [book-edit-form.component.ts](src/app/books/book-edit-form.component.ts), [HTML](src/app/books/book-edit-form.component.html)                            | Independent form draft with title/page validation, Save output, and Cancel navigation without mutation.                                                               |
| [theme.service.ts](src/app/shared/theme.service.ts)                                                                                                      | Explicit, idempotent startup initialization; signal-backed theme state; document-root and storage updates on commands.                                                |
| [http-error.interceptor.ts](src/app/shared/http-error.interceptor.ts)                                                                                    | Reports unexpected HTTP failures and rethrows the original error; suppresses reporting of explicitly expected 404 responses.                                          |
| [global-error-handler.ts](src/app/shared/global-error-handler.ts), [error-reporter.service.ts](src/app/shared/error-reporter.service.ts)                 | Reports unhandled errors, deduplicates repeated error objects, and exposes a dismissible notice for unexpected runtime failures.                                      |
| [loading-indicator.component.ts](src/app/shared/loading-indicator.component.ts), [state-message.component.ts](src/app/shared/state-message.component.ts) | Shared request feedback with status/alert semantics, reduced-motion loading, projected headings, and page-owned action content.                                       |
| [toast.service.ts](src/app/shared/toast.service.ts)                                                                                                      | Existing Material snackbar wrapper, available for explicit notifications; request errors currently use inline page feedback.                                          |
| [styles.css](src/styles.css), [material-theme.scss](src/material-theme.scss)                                                                             | Tailwind import, semantic light/dark palettes, common interaction styles, native color scheme, and matching snackbar color overrides.                                 |
| [index.html](src/index.html), [public/](public/)                                                                                                         | Browser HTML shell, fonts/icon stylesheets, and static assets.                                                                                                        |

The root shell and routed book pages use separate HTML files. Small presentation components keep inline templates.
Templates use `@if`, `@switch`, and `@for` with stable book IDs. All production components use `OnPush` and the default
standalone behavior. Component contracts use `input()`/`output()`; local UI state uses signals and computed values.
Pages subscribe to composed request state once through the async pipe, retaining RxJS cancellation and query timing.

The modernization follows the installed Angular CLI 20.2.0 MCP server's `get_best_practices` guide, retrieved directly
over stdio. [Cursor MCP configuration](.cursor/mcp.json) exposes the CLI server for editor sessions. No Angular upgrade
or dependency changes were needed. The production build's initial bundle decreased from 445.74 kB to 307.44 kB through
lazy component routes and removal of the unused animation provider. Route-specific chunks load when needed; these
figures describe the initial build budget rather than the total bytes fetched during a visit.

The standalone [book review example](src/components/book-review-example.component.ts) is an intentionally flawed fixture
for pull-request code-review exercises. It lives under the requested `src/components/` path and is not part of the routed
application. Its defects are deliberate review material rather than production conventions to copy.

## Runtime architecture and data flow

```mermaid
flowchart TD
    Config["App providers"] --> Init["Theme and library initializers"]
    Init --> App["Shell, notices and router outlet"]
    App --> List["Collection: catalogue load and local query"]
    App --> Details["Details: route book and personal controls"]
    App --> Edit["Edit route and independent form draft"]
    List --> APIClient["BookApiClient: GET only"]
    Details --> APIClient
    Edit --> APIClient
    APIClient --> Interceptor["HTTP error interceptor"]
    Interceptor --> API["Bookmonkey API: base catalogue"]
    Interceptor --> Reporter["Deduplicated error reporting"]
    Library["BookLibraryService"] --> List
    Library --> Details
    Edit --> Library
    Details --> Library
    Library --> Storage["Browser localStorage"]
```

### Catalogue, query, and personal views

The API supplies the base catalogue (250 books in the current local dataset). The list loads the complete array through
`getBooks()`, then combines that request state with the browser library and a typed query. Local metadata edits are
applied before matching or sorting. This makes edited titles/authors/publishers/page counts consistent across details,
search, filters, and personal views.

- Search trims whitespace and ignores case. One normalized character matches only the title's beginning; two or more
  characters match literal text anywhere in the title. Author, subtitle, or description matches alone do not qualify.
- Nonempty typing waits 300 ms; a new query replaces an obsolete timer. Clear and filter/sort/view changes run immediately.
  Local queries do not emit HTTP requests. Retrying a catalogue error starts a fresh GET.
- Author and publisher filters match case-insensitive text. Minimum and maximum pages are inclusive and combine with the
  title search and reading-status filter. Invalid minimum/maximum order has an explicit inline message.
- Sorting supports title or author ascending/descending. Default order preserves the API collection order, except in the
  recent view, where the most recent unique visit comes first.
- All books, Read later, and Recently viewed select the collection membership. Saved/status changes update these views
  immediately through library state.
- Matching and ordering operate on the whole merged collection before the visible-result limit. The default limit is 10;
  Show more extends it by the page size. Result count describes all matches, not only visible cards.
- Request state remains a discriminated union: loading, ready with data, or error with a message. Empty results are a
  successful state. The async pipe owns the list subscription and cancels pending load/timer work on destruction.

The catalogue is reloaded when the collection page is recreated; no query-cache dependency has been added. Loading the
whole dataset fits the current workshop catalogue. A substantially larger collection would need a backend contract that
can combine original records and per-user edits before server-side filtering/pagination.

### Gallery and interactive Universe

The home page has Gallery and Universe display tabs, independent of the All books/Read later/Recently viewed collection
selection. Switching display keeps the same search, filters, sorting, membership, and catalogue subscription. The gallery
keeps its extendable visible-result limit. `CollectionPage.matchingBooks` exposes every filtered/sorted match to the map,
including books beyond the initial ten cards; neither tab starts another catalogue request.

[BookUniverseComponent](src/app/books/book-universe.component.ts) owns only map presentation, selection, and camera
interaction. Its [HTML](src/app/books/book-universe.component.html) and [CSS](src/app/books/book-universe.component.css)
render an SVG star map, native controls, and a shared-cover preview linked to the existing details route. The pure
[layout function](src/app/books/book-universe-layout.ts) positions books deterministically in constellations grouped by
publisher or author, using the currently displayed metadata including local edits. It preserves the query's book order
for keyboard navigation and the native book selector. No genre metadata, new route, dependency, or API write is added.

The camera supports bounded zoom, pointer dragging/capture, Ctrl/Meta-wheel zoom, keyboard panning, and Fit all. Each
star has an accessible name and selected state; one star participates in tab order, with arrow/Home/End navigation
between stars. The native selector provides an alternative to small visual targets on narrow screens. Star labels and
decorative glows do not intercept the interactive hit area. New matching data or grouping resets the overview and keeps
the selected book where still present. Map state and display selection are local to the page, not persisted preferences.

The map's required book input is a signal. `linkedSignal` preserves a selected ID while it remains in the matches,
chooses the first match when necessary, and resets the writable camera when matching books or grouping change. The
shared cover uses the same source-linked pattern to clear failure state for a new image URL.

Loading, retry/error, and empty feedback remain owned by the collection page in either display. The map adapts its
preview below the canvas on narrow screens; the star field intentionally keeps its dark astronomical palette in both
application themes. Outside the chart, controls and preview use the existing semantic theme styles.

### Browser-local library and editing

The user explicitly chose to store all changes in this browser. `BookLibraryService.initialize()` is called through
`provideAppInitializer`; constructors only inject dependencies or assemble state. The service reads
`bookmonkey-library-v1`, validates its shape, and exposes state through a read-only observable.

Stored state contains saved book IDs, reading statuses keyed by ID, unique recent IDs in visit order, and metadata
overrides keyed by stable ID. Commands update the current state and attempt to persist it. Storage read/parse/write
failures leave the app usable and display a notice; unsuccessful writes are identified as available for this visit only.
There is no account, cross-device synchronization, API mutation, or automatic cross-tab state synchronization.

Cards and details share save/unsave and status controls. Status can be unset or one of Want to read, Reading, and Finished.
Successful detail loads record a visit without duplicating the same ID; revisiting moves it to the front. The API still
supplies the base records, so browser-local changes do not imply offline catalogue availability.

`/books/:id/edit` loads a book and copies its merged metadata into an independent form draft. Save stores a local
override and returns to details; Cancel leaves stored data unchanged. Title must be nonblank and page count a positive
whole number. Editable fields are title, subtitle, author, publisher, ISBN, page count, formatted price, cover URL, and
description. Book ID and user ID are not edited; changing the displayed ISBN does not change routing identity.

The editor and collection filters use typed reactive `FormGroup` controls. `ngOnChanges` copies new editor input into
the form; submit validates the complete draft before emitting trimmed metadata. Filter input changes synchronize
without re-emitting, while user changes emit through a subscription owned by `takeUntilDestroyed`. Search and native
reading-status/map selectors use direct value/event bindings. No production template uses `ngModel`.

The API URL is injected through `BOOK_API_URL`, defaulting to `http://localhost:4730/books`. Single-book IDs are
URL-encoded, and trailing slashes are normalized. All catalogue requests are GETs. Direct detail/editor links and refreshes
load original records and reapply local overrides. Descriptions remain plain text with preserved line breaks.

### Error handling and presentation

The functional HTTP interceptor reports failures and rethrows the original error. Single-book requests mark HTTP 404 as
expected through context, so details and editors render a local not-found state without a global report. Other HTTP
failures are reported once and recovered into page-owned error/retry state.

Browser global listeners forward unhandled errors to `GlobalErrorHandler`. The shared reporter deduplicates error objects
by identity, logs context to the console, and exposes one dismissible shell notice for unexpected runtime failures.
HTTP errors do not also create that notice or a toast. A shared bootstrap fallback remains available before the UI exists.
Storage warnings are expected local-state feedback, separate from unexpected runtime reports.

Large pages and forms use external HTML; small presentation components use inline templates. Shared loading/state/cover
components retain accessible announcements and cover fallbacks. Page templates own heading levels and actions. Stable
book-ID tracking preserves card identity while local metadata and personal state update.

### Theme and interaction styles

`ThemeService.initialize()` still supplies the saved/system light/dark choice before the shell renders. Only explicit
toggles persist the choice; blocked storage does not disable switching. The document-root `dark` class and native
`color-scheme` remain centralized.

Semantic Tailwind utilities map to the shared light/dark CSS palette. `button-primary`, `button-secondary`,
`form-control`, `text-link`, and `focus-ring` share interaction styling. Pressed personal-view/save controls have a
visible selected state. Snackbar colors use the same palette; layout stays local to templates.

## Build and configuration

[angular.json](./angular.json) defines a single application named `angular-workshop-modern`. Its build uses `@angular/build:application` with `src/main.ts` as the browser entry, `zone.js` as a polyfill, `public/` as the asset source, and both global style files.

- Production is the default build configuration and enables output hashing. Bundle budgets warn at 500 kB and fail at 1 MB for the initial bundle; component styles warn at 4 kB and fail at 8 kB.
- The development server defaults to the development configuration, with optimization disabled and source maps enabled.
- [tsconfig.json](./tsconfig.json) enables TypeScript strictness, strict Angular templates and injection checks, isolated modules, and an ES2022 target with preserved module syntax.
- [tsconfig.app.json](./tsconfig.app.json) includes application TypeScript and excludes `*.spec.ts`; [tsconfig.spec.json](./tsconfig.spec.json) declares Jasmine test types.
- Tailwind is imported from the global CSS file and processed through PostCSS. Semantic CSS variables supply the light/dark palettes; the SCSS file aligns Material snackbar colors with those tokens rather than defining a full Material theme.

## Development commands and tests

### GitHub automation

The [workflow guide](.github/README.md) describes build/test/Pages deployment, OpenAI issue analysis, PR review, issue
implementation, and CI auto-fix. Codex reads issue/PR snapshots captured through the GitHub API and uses repository
`AGENTS.md` guidance with explicit prompt files. Analysis/review is read-only; separate jobs publish the resulting
comments. Implementation and auto-fix produce checked working-tree patches which a shared reusable workflow publishes
as draft PRs on new branches. Publication verifies the base commit and never directly changes the default branch.

The build workflow runs the six application Chromium suites and publishes the Angular browser artifact when the default
branch is deployed to Pages, with the Pages base path and an SPA fallback. On default-branch runs, Configure Pages uses
the `PAGES_SETUP_TOKEN` repository secret and automatic enablement; other GitHub operations use the automatic job token.
Repository secrets, Pages availability, and permission to create pull requests are repository settings, not app
configuration. Frontend deployment does not provide
the separate book API. Browser fixtures still establish local application behavior rather than deployed integration.

Build, auto-fix, and issue implementation all validate using `npm run build` and the same application browser suites.
Node.js 24 is selected through [.node-version](.node-version) and restored after Codex before independent validation.
Dependency installation explicitly includes development packages; browser binaries are refreshed after reinstalling a
changed lockfile. The [Pages helper](.github/scripts/prepare-pages.cjs) prepares the generated base URL and route fallback
after checks, with focused [tests](.github/scripts/prepare-pages.test.cjs). Pages preparation does not change the shared
build command or application source.

### Local development and checks

Run commands from the repository root. The API and frontend require separate processes.

`npm run eval.gpt` starts the separate code-generation playground through
[tools/eval.mjs](tools/eval.mjs). The launcher uses the playground's working directory, selects `gpt-5.1-no-thinking`
for the goal-tracker prompt, forwards extra arguments, and normalizes absolute Windows ES module imports
for scorer 0.0.69. The playground installs Angular template dependencies during evaluation. Live runs require
`OPENAI_API_KEY` for generation and `GEMINI_API_KEY` for the existing default ratings/summary. The scorer maps the GPT
alias to `gpt-5.1` with reasoning effort `none`. `npm run eval.opus` remains a compatibility alias, and both root and
playground entrypoints use the same launcher. Historical reports retain their original model selection. Evaluation is separate
from the BookMonkey build and regression suites; no live evaluation result is implied by a launcher check.

On Windows, the evaluation launcher redirects only scorer's filesystem helper import to
[scorer-windows-fs.mjs](tools/scorer-windows-fs.mjs). It links dependency directories using junctions while preserving
other filesystem operations. This avoids workspace setup failures caused by ordinary directory symlink permissions.
Focused [filesystem tests](tools/scorer-windows-fs.test.mjs) verify dependency access and preservation of source files.
An evaluation with no results and zero maximum points has no defined score percentage; its completion metadata records
the failed prompts. Existing failed reports are retained, and real scores require another completed evaluation.

`npm run report` uses [tools/report.mjs](tools/report.mjs) to launch the playground's report command, retaining its
working directory so the viewer finds the saved `.web-codegen-scorer/reports` files. The viewer defaults to port 4201,
separate from BookMonkey's port 4200. An explicit override such as `npm run report -- --port=4300` is forwarded once.

The custom [Angular component MCP server](tools/angular-mcp/index.ts) is separate from the Angular CLI's built-in MCP
server configured in `.cursor/mcp.json`. Build it with `npm run build.angular-mcp` and start it with
`node dist/angular-mcp/index.js`. Its `generate_component` tool invokes the installed CLI with separate arguments,
supports paths with or without the `src/app` prefix, and returns tool errors for failed generation. Diagnostic logs
use stderr so stdout remains an MCP protocol channel. Register it separately in `~/.cursor/mcp.json` with the absolute
compiled-server path; the project MCP configuration retains the Angular CLI's built-in server.
VS Code's Copilot harness reads the custom server from the workspace [.mcp.json](.mcp.json), using the native
`mcpServers` schema. That entry contains this checkout's absolute compiled-server path; adjust it for another location.

| Command                | Effect                                                                                                                                                          |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm install`          | Installs the frontend dependencies.                                                                                                                             |
| `npx bookmonkey-api`   | Starts the separately distributed fake-data API at `http://localhost:4730`, as described in [README.md](./README.md). This package is not a project dependency. |
| `npm start`            | Runs `ng serve`; the local frontend is expected at `http://localhost:4200`.                                                                                     |
| `npm run build`        | Builds the production application.                                                                                                                              |
| `npm run watch`        | Rebuilds continuously with the development configuration.                                                                                                       |
| `npm test`             | Invokes the configured Angular Karma target; see the current testing status below.                                                                              |
| `npx playwright test`  | Runs the tests selected by [playwright.config.ts](./playwright.config.ts).                                                                                      |
| `npm run format.write` | Formats supported files under `src/`; the script does not include Markdown files at the repository root.                                                        |

The browser suites share [book-fixtures.ts](tests/book-fixtures.ts), which supplies books, intercepted read-only API/cover
responses, and captured application error reports. They do not require a running API.

- [book-details.spec.ts](tests/book-details.spec.ts): navigation, fields, direct links/reloads, loading, retries, missing
  books/covers, and narrow layouts.
- [book-list.spec.ts](tests/book-list.spec.ts): actual one-letter/longer/literal title matching, author-only exclusion,
  both sort fields/directions, combined inclusive filters, range validation, debouncing/clear without search HTTP calls,
  full-catalogue matching before limits, Show more, teardown, and catalogue error recovery.
- [library.spec.ts](tests/library.spec.ts): saved/status persistence and removal, recent order/deduplication, local edits
  and unchanged IDs, edited-field matching/filtering, no API writes, browser-context isolation, cancel, validation,
  editor refresh/not-found, storage failure feedback, and mobile/dark layouts.
- [error-handling.spec.ts](tests/error-handling.spec.ts): local 404 outcomes, HTTP/network errors and retries, and
  deduplicated runtime reporting.
- [theme.spec.ts](tests/theme.spec.ts): keyboard switching, actual color changes, preference precedence, navigation/reload,
  system defaults, narrow screens, and blocked storage.
- [universe.spec.ts](tests/universe.spec.ts): display tabs and keyboard focus, preserved query/personal views, 250 matching
  stars before gallery limits, no extra catalogue requests, preview/details navigation, zoom/drag/Fit, keyboard star
  navigation, grouping, cover recovery and selection/camera updates, loading/error/retry/empty feedback, and 320px layouts
  in both themes.
- [example.spec.ts](tests/example.spec.ts) and [tests-examples/](tests-examples/) remain external demonstration scaffolding.
  Karma still has no source specs or directly declared Karma/Jasmine dependencies.

Playwright starts or reuses the frontend at port 4200. Install the matching browser for the project's Playwright version.
A portable selected-suite command is:

```sh
npx playwright test tests/book-details.spec.ts tests/book-list.spec.ts tests/library.spec.ts tests/error-handling.spec.ts tests/theme.spec.ts tests/universe.spec.ts --project=chromium
```

The unused NgRx, toolkit, query, and server packages listed above remain declared workshop options. This refactoring uses
the existing Angular/RxJS stack and retains those packages to preserve the workshop setup; none has been integrated into
the runtime. [REFACTORING.md](REFACTORING.md) records the original findings and implementation status.
