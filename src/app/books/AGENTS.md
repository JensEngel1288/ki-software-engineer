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
  and a typed, debounced collection query. [book-collection.ts](book-collection.ts) applies local edits, literal title
  search, filters, view selection, and sorting before the visible-result limit. One-letter searches match title starts;
  longer searches match anywhere in titles, case-insensitively. Author/description-only matches are not title matches.
- Search typing waits 300 ms, replacing obsolete delays. Clear, sort/filter/view changes, and page-size updates run
  immediately without extra search HTTP calls. Retry reloads the catalogue. Preserve async-pipe teardown and Show more.
- [book-item.component.ts](book-item.component.ts) presents its `Book` input and links the title to the details route.
  Keep it free of HTTP requests. Use [book-cover.component.ts](book-cover.component.ts) for both missing and broken covers;
  its image failure state resets when the source changes.
- [book-details.component.ts](book-details.component.ts) loads the book from the route ID and owns details loading,
  not-found, request-error, and retry states. Its cover uses the same presentation component as cards.
- [request-state.ts](request-state.ts) defines the discriminated request-state union. Successful states contain data;
  list empty results are successful empty arrays, and details add a feature-specific not-found outcome. Keep the page
  templates in their adjacent HTML files and subscribe once through the async pipe.
- [book-library.service.ts](book-library.service.ts) owns browser-only saved IDs, reading statuses, unique recent IDs,
  and metadata edits keyed by stable book ID. Initialize storage explicitly through the app initializer. Constructor
  injection must not read storage. Persist only through commands and disclose storage failures while retaining session
  usability. [book-library.ts](book-library.ts) validates stored data and applies local overrides.
- [book-edit.component.ts](book-edit.component.ts) loads the original book and supplies a separate editing draft to
  [book-edit-form.component.ts](book-edit-form.component.ts). Save updates browser state; Cancel must not mutate the book.
  Preserve IDs, keep price as display text, and validate a nonblank title and positive whole-number page count.

## API and navigation contracts

- The API runs separately at `http://localhost:4730/books` by default. Its URL is supplied through `BOOK_API_URL` in
  application configuration, not embedded in the API client.
- `getBooks()` reads the full catalogue. Search, sorting, filters, and visible-result limits operate on the merged local
  collection so browser-edited fields participate correctly; never filter only the first already-visible books.
- All catalogue HTTP access is read-only. The user explicitly chose browser-local edits and personal state. Do not add
  API mutations, login, or cross-account synchronization without a change in requirements.
- `getBook(id)` fetches `/books/:id`, URL-encodes the ID, and marks HTTP 404 as an expected local outcome through request
  context. Other HTTP failures are reported centrally and rethrown. Verify the backend contract before changing endpoints,
  parameters, or model fields.
- The collection is at `/`, details at `/books/:id`, and editing at `/books/:id/edit`, configured in
  [app.routes.ts](../app.routes.ts).
  Details must work on direct navigation and browser refresh without relying on previously loaded list data.
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
- Existing coverage includes title-link keyboard navigation, displayed fields, direct URLs, reloads, loading, failed
  requests and retries, missing books, missing/broken covers, and a narrow viewport without a subtitle. Verify affected
  behavior beyond these cases when needed. The list/error suites also cover actual title matching, sorting, combined
  filters, replacement of typing delays, clearing, full-catalogue matching before limits, failures, and reporting.
  Library checks cover persistence, recent ordering, local edits without HTTP writes, cancel, validation, isolation, and
  storage failures. Tests must assert observable behavior, not obsolete per-search HTTP traffic.
