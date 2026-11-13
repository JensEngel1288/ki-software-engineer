# Books feature guidance

Applies to `src/app/books/` and its descendants. Inherit the [root guidance](../../../AGENTS.md) and
[shared source guidance](../../AGENTS.md). See [ARCHITECTURE.md](../../../ARCHITECTURE.md) for the full data flow and
query lifecycle and error-reporting boundaries.

## Responsibilities

- [book.ts](book.ts) defines the shared `Book` model. IDs and ISBNs are strings and serve different purposes. `author` is
  a single string, `subtitle` is optional, and `price` is an already formatted string; preserve its currency formatting.
- [book-api-client.service.ts](book-api-client.service.ts) owns HTTP access. Keep request construction here and reuse
  the model throughout the feature.
- [book-list.component.ts](book-list.component.ts) loads the full base catalogue and combines it with local library state
  and a typed, debounced collection query. [book-collection.ts](book-collection.ts) merges created books and applies local
  edits, literal title search, filters, view selection, and sorting before pagination. One-letter searches match title starts;
  longer searches match anywhere in titles, case-insensitively. Author/description-only matches are not title matches.
- Search typing waits 300 ms, replacing obsolete delays. Clear, sort/filter/view changes, and page-size updates run
  immediately without extra search HTTP calls and reset to page one. Retry reloads the catalogue. Preserve async-pipe
  teardown; clamp pages after membership changes. [book-pagination.component.ts](book-pagination.component.ts) presents
  Previous/Next, page status, and native page selection; the default page size is ten.
- [book-item.component.ts](book-item.component.ts) presents its `Book` input and links the title to the details route.
  Keep it free of HTTP requests. Use [book-cover.component.ts](book-cover.component.ts) for both missing and broken covers;
  its image failure state resets when the source changes.
- The home recommendation tile links to `/recommendation`. [book-recommendation.component.ts](book-recommendation.component.ts)
  owns loading/retry/empty UI and shared cover/personal controls. [book-recommendation.ts](book-recommendation.ts) selects
  a monthly pick from the whole merged collection using sorted IDs and the browser calendar. Keep it independent of
  gallery filters/pages/API order; use real metadata and preserve browser-local edits and created records.
- Production components use signal inputs/outputs and `OnPush`. Cover failure, map selection, and map camera reset
  through `linkedSignal` when their source data changes. Keep a selected book while it still matches; otherwise select
  the first match. Updated map data returns the camera to the overview.
- [book-details.component.ts](book-details.component.ts) loads the book from the route ID and owns details loading,
  not-found, request-error, and retry states. Its cover uses the same presentation component as cards.
- [request-state.ts](request-state.ts) defines the discriminated request-state union. Successful states contain data;
  list empty results are successful empty arrays, and details add a feature-specific not-found outcome. Keep the page
  templates in their adjacent HTML files and subscribe once through the async pipe.
- [book-library.service.ts](book-library.service.ts) owns browser-only saved IDs, reading statuses, unique recent IDs,
  local created books, column order, and metadata edits keyed by stable book ID. Initialize storage explicitly through the app initializer. Constructor
  injection must not read storage. Persist only through commands and disclose storage failures while retaining session
  usability. [book-library.ts](book-library.ts) validates stored data, preserves older storage shapes, and applies local overrides.
- [book-edit.component.ts](book-edit.component.ts) loads the original book and supplies a separate editing draft to
  [book-edit-form.component.ts](book-edit-form.component.ts). Save updates browser state; Cancel must not mutate the book.
  Preserve IDs, keep price as display text, and validate a nonblank title and positive whole-number page count.
- [book-create.component.ts](book-create.component.ts) reuses that form. Keep new `local-` UUIDs distinct from ISBNs.
  Details/edit routes resolve created records from the library before making HTTP requests.
- Editing and filters use Signal Forms with independent typed signal models. Reset incoming data in `ngOnChanges`;
  draft changes must never mutate the input book. Editor schemas own required/nonblank titles and positive whole pages;
  `FormRoot` handles validation/submission. Let `FormField` own control names and schema-derived native attributes.
  Filters emit from label-level native events after field bindings update; programmatic synchronization stays silent.
  Clear resets the form and emits once. Do not reintroduce `valueChanges` subscriptions or a second form-state copy.

- [book-universe.component.ts](book-universe.component.ts) owns the home-page Universe display's SVG, preview, selection,
  and camera controls. [book-universe-layout.ts](book-universe-layout.ts) owns deterministic 3D world coordinates and
  perspective projection by publisher/author. Keep it free of HTTP, storage, and navigation side effects; the preview uses the existing details
  link and shared cover component. Preserve keyboard access, native selection, drag/zoom/Fit, and narrow-screen usability.
- Universe dragging/arrows orbit the camera; Shift-drag/Shift-arrows pan. Keep native rotate/tilt controls, bounded pitch/
  zoom, perspective-scaled stars, and Fit all's complete camera reset. Decorative dust, labels, and glows must not intercept
  star targets. Stop ambient animation for reduced motion; camera movement remains user-controlled.
- Gallery/Universe/Reading list display selection is independent of collection membership. `CollectionPage.matchingBooks`
  contains all filtered/sorted matches for the map and board; `books` contains only the current gallery page. Switching
  display preserves the query and existing subscription. Collection request feedback remains owned by the page.
- [book-reading-board.component.ts](book-reading-board.component.ts) presents the three reading columns, CDK drag/drop,
  and native add/status/remove controls. Defer its code until its tab is selected. The library service owns status and
  order for every display. Use stable ID anchors when moving filtered cards; do not overwrite hidden card order.

## API and navigation contracts

- The API runs separately at `http://localhost:4730/books` by default. Its URL is supplied through `BOOK_API_URL` in
  application configuration, not embedded in the API client.
- `getBooks()` reads the full catalogue. Search, sorting, filters, and visible-result limits operate on the merged local
  collection so browser-edited fields participate correctly; never filter only the first already-visible books.
- All catalogue HTTP access is read-only. The user explicitly chose browser-local creation, edits, and personal state. Do not add
  API mutations, login, or cross-account synchronization without a change in requirements.
- `getBook(id)` fetches `/books/:id`, URL-encodes the ID, and marks HTTP 404 as an expected local outcome through request
  context. Other HTTP failures are reported centrally and rethrown. Verify the backend contract before changing endpoints,
  parameters, or model fields.
- The collection is at `/`, creation at `/books/new` (before the dynamic ID route), details at `/books/:id`, and editing at `/books/:id/edit`, configured in
  [app.routes.ts](../app.routes.ts).
  Details must work on direct navigation and browser refresh without relying on previously loaded list data.
- `/recommendation` is a lazy route and fetches the catalogue on entry/retry. The home shortcut performs no extra request.
- Keep title links keyboard-accessible and provide a link back to the collection.

## Details behavior and validation

- Preserve distinct loading, HTTP 404, and retryable request-error states. Keep request error handling inside the
  route/retry stream and cancel obsolete requests when the route changes or the view is destroyed.
- Use the shared cover fallback in cards and details. Render abstracts as plain text with line breaks preserved,
  and render optional subtitles only when present.
- Run `npx playwright test tests/book-details.spec.ts tests/book-list.spec.ts tests/error-handling.spec.ts --project=chromium`
  from the repository root for relevant feature changes. Include `tests/library.spec.ts` for personal state/editing and
  `tests/theme.spec.ts` for shared styling/theme changes. Shared fixtures intercept book and cover requests, so the suites
  do not require the external API.
- Include `tests/universe.spec.ts` for display switching, full-match projection, constellation layout/interactions, and
  shared query changes. It covers a 250-book collection, keyboard controls, and both themes at 320px.
- Existing coverage includes title-link keyboard navigation, displayed fields, direct URLs, reloads, loading, failed
  requests and retries, missing books, missing/broken covers, and a narrow viewport without a subtitle. Verify affected
  behavior beyond these cases when needed. The list/error suites also cover actual title matching, sorting, combined
  filters, replacement of typing delays, clearing, full-catalogue matching before limits, failures, and reporting.
  Library checks cover persistence, recent ordering, local creation/editing without HTTP writes, cancel, validation,
  isolation, storage failures, board migration, real CDK dragging, and reordering/reload. List checks include numbered
  pagination, query resets, and clamping. Tests assert observable behavior, not obsolete per-search HTTP traffic.
  List-suite recommendation cases cover keyboard entry, monthly stability/rollover, edits/local books, loading/retry/
  empty states, details links, persisted actions, and narrow layouts in both themes.
