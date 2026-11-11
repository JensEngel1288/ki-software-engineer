# BookMonkey search and personal library

Task status: completed
Definition status: agreed
Implementation status: completed and verified

## Sources

- The user asked to apply the context-recovery and requirements-interview skills to BookMonkey.
- In the first interview answer, the user said: “search function does not work properly. also give me some examples of
  what i could put on my page”.
- The user supplied this failing example: searching for books that start with `j` still displays books starting with
  other letters.
- Asked whether every query should match only the title's beginning (for example, `java` including `JavaScript` but
  excluding `Learning Java`), the user answered “no”. Do not implement that rejected general rule.
- The user then explicitly selected: “No—single-letter searches should match only the title’s first letter.” Therefore
  `j` must exclude a title such as `Node.js, MongoDB and Angular Web Development`.
- Asked whether two or more characters should match only titles containing that text, with `java` finding both
  `JavaScript` and `Learning Java`, the user answered “yes”.
- The user subsequently requested implementation of sorting by title/author, filters by author/publisher/page count,
  saved books, reading status, recently viewed books, and editing books.
- Asked where to persist these changes, the user selected “Store everything in this browser, including book edits.”
  This supersedes the earlier proposal to send edits to the API.
- [Architecture](../../ARCHITECTURE.md) and the source files below provide technical context, not additional user-selected
  features or acceptance criteria.

## Goal and confirmed requests

- **R1:** A single-letter query matches only titles beginning with that letter.
- **R2:** Provide examples of possible page additions. This information request is complete; the suggestions later
  selected for implementation are tracked separately in R5–R10.
- **R3:** Queries containing two or more characters match the text anywhere in the book title.
- **R4:** A match in another field alone must not qualify a book whose title does not satisfy the applicable rule.
- **R5:** Sort books by title or author. Provide both ascending and descending choices.
- **R6:** Combine author, publisher, and inclusive minimum/maximum page-count filters with the current search/view.
- **R7:** Save and remove books from a read-later list that survives browser reloads.
- **R8:** Set and change a book's reading status to Want to read, Reading, or Finished; preserve it across reloads.
- **R9:** Track opened books in a recently-viewed list, with unique entries and the most recently opened book first.
- **R10:** Edit book metadata locally, save valid changes, or cancel a draft without changing the book. Keep the stable
  book ID unchanged and show saved edits consistently in details, search, sorting, and filters.
- **R11:** Persist all personal state and book edits in this browser. Do not send catalogue mutations to the API or
  introduce user-account synchronization.

## User story

As someone browsing BookMonkey, I want one-letter searches to match the start of book titles and longer searches to match
text anywhere in titles, so that I can find relevant books without unrelated results.

As a reader managing a personal library, I want to sort/filter books, save books for later, track reading status, revisit
books, and edit their displayed details, so that I can organize my collection on this browser.

## Acceptance criteria

### R1 — One-letter title search

Given the collection contains `JavaScript`, `jQuery`, and `Node.js`
When I search for `j`
Then `JavaScript` and `jQuery` qualify as matches
And `Node.js` does not qualify merely because it contains `j` later in the title.

### R3 — Longer title search

Given the collection contains `JavaScript`, `Learning Java`, and `Learning Python`
When I search for `java`
Then `JavaScript` and `Learning Java` qualify as matches
And `Learning Python` does not qualify.

### R4 — Other fields do not create title matches

Given a book's author, subtitle, or abstract matches the search text
And its title does not satisfy the applicable one-letter or longer-query rule
When I search for that text
Then that book is excluded.

These scenarios describe matching eligibility; the existing result limit still applies. Case-insensitive matching is
preserved from the current API behavior, as illustrated by the lowercase queries and capitalized titles above.

### R5/R6 — Collection organization

Given the collection contains books with different titles, authors, publishers, and page counts
When I choose a sort order or enter filters
Then the matching collection uses those choices together with the current search
And matching/sorting happen before limiting visible results.

### R7/R8/R11 — Persistent personal lists

Given I am viewing a book
When I save it for later or change its reading status and reload the page
Then my choices remain visible in this browser
And I can remove the saved book or change/clear its status.

### R9 — Recently viewed books

Given I have opened multiple book detail pages
When I choose Recently viewed
Then each viewed book appears once, with the latest visit first by default
And the history remains available after reload.

### R10/R11 — Local book editing

Given an existing book is open in the editor
When I save valid changes
Then the changed values appear in details and the collection, including relevant search/sort/filter results
And they survive reload without an API write.

Given I change fields in an editing draft
When I cancel
Then the previously saved book remains unchanged.

## Verified technical context

- [BookListComponent](../../src/app/books/book-list.component.ts) trims query text and delays nonempty typing by 300 ms.
  Initial loading, clearing, and retrying run without that delay. The query stream replaces obsolete work.
- Before this implementation, `BookApiClient` sent `_limit` and optional `q` parameters. It now loads the full base
  catalogue through GET; the merged browser-local collection supplies search, filters, and sorting.
- A read-only request to the running API at `/books?_limit=3&q=Angular` returned three books. This verifies that one API
  search request completed, not that the user's failing scenario works or that the results match their expectations.
- A request to `/books?_limit=8&q=j` returned eight books, including `Java Web Scraping Handbook`, `Hacking Exposed Web
Applications, 3rd Edition`, and `Node.js, MongoDB and Angular Web Development, 2nd Edition`. Some returned titles contain
  no `j`. A separate improbable search term returned no books. These observations do not establish the user's intended
  matching policy.
- [List tests](../../tests/book-list.spec.ts) intercept API responses. Their coverage of cancellation and recovery does
  not establish correct matching against the live book collection.
- Read-only API probes confirmed that `title_like=^j` returns titles beginning with `J` or `j`, while `title_like=java`
  includes titles with `Java` later in the title, such as `Learn Java for Web Development` and `HTML5 and JavaScript Web
Apps`. An improbable anchored title pattern returned no books. These probes establish a supported technical option,
  not a completed application fix.

## Technical notes and implementation approach

- The earlier server-side `title_like` proposal was valid for the original catalogue, but local edits must also affect
  matching and organization. Load the complete base catalogue (currently 250 books), apply browser-local edits, and
  perform literal case-insensitive title matching, filtering, sorting, and view selection before visible-result limits.
- Apply the matching rule after the existing whitespace trimming. Preserve case-insensitive behavior, the 300 ms typing
  delay, immediate clear/retry, cancellation, page-size limits, and existing loading/empty/error presentation.
- Filter the collection before applying the result limit; filtering only the first already-loaded books could hide
  valid matches elsewhere in the collection.
- Use explicit startup initialization for browser-library storage, with a read-only observable state and command methods.
  Store local edits by stable book ID; keep original API data untouched. Keep editing drafts separate until Save.
- Extend browser coverage with mixed-title matching, combined filters/sorting, read-later/status persistence, recent
  ordering, valid/invalid edits, cancel, browser isolation, and assertions that no API writes occur. Retain catalogue
  load/retry, debounce/clear, navigation, error-reporting, and theme checks; remove obsolete assumptions that every local
  search emits an HTTP request.
- The existing Angular/RxJS implementation and API support the selected behavior. No additional dependency is indicated.

## Readiness and scope

- The selected matching behavior is defined; no interview question is pending for R1, R3, or R4.
- Scope now includes all selected features R1/R3–R11 and their verification. R2 (providing examples) is complete.
- New account/login functionality and API catalogue writes are outside the selected browser-local persistence scope.

## Implementation and verification

- R1/R3–R11 are implemented. The collection includes sorting, combined filters, read-later and recently-viewed views,
  reading statuses, and local editing. Shared controls and separate page templates preserve the earlier refactoring.
- `npm run build` passed, including strict Angular template checks.
- All 32 Chromium tests passed across `book-details`, `book-list`, `error-handling`, `theme`, and `library` specs.
  A temporary ignored Playwright configuration selected the locally installed Chromium executable; no machine-specific
  browser path was added to the project configuration. Firefox and WebKit were not run.
- A separate check against the running API verified title-prefix matching, persisted saved/status/edit state, and an
  unchanged original API book. No catalogue writes or browser runtime errors occurred. Desktop and 320px mobile checks
  covered both themes and confirmed no horizontal overflow.
- Formatting, documentation links, and whitespace checks passed. Architecture and scoped agent guidance reflect the
  completed behavior. No requirement question or implementation step remains pending.
