# BookMonkey test patterns

Read this reference when creating tests with `tdd-red`. These examples illustrate a previously agreed search scenario;
they are not a new feature request. That behavior is already implemented, so these cases may pass. Adapt patterns to
the selected requirements instead of installing these examples as deliberately failing tests.

## Check the available harness

- [package.json](../../../../package.json), [angular.json](../../../../angular.json), and
  [tsconfig.spec.json](../../../../tsconfig.spec.json) describe the unit-test setup. At skill creation, `npm test` targets
  Karma and the spec configuration requests Jasmine types, but the package manifest declares no Jasmine/Karma test
  dependencies and there are no existing source specs. Do not assume this is an operational unit harness. Recheck before
  invocation; scaffold requested unit cases and record the missing setup if it remains unavailable.
- [playwright.config.ts](../../../../playwright.config.ts) discovers browser specs under `tests/` and starts or reuses
  the frontend server. [book-fixtures.ts](../../../../tests/book-fixtures.ts) supplies a test-scoped page with API/cover
  interception, `book`, `mockBooks`, `appUrl`, and `expect`. Prefer these fixtures over a running external book API.
- Use actual selected paths in commands. A browser example is
  `npx playwright test tests/search.spec.ts --project=chromium`. Only with a working unit harness, an example is
  `npm test -- --watch=false --browsers=ChromeHeadless --include=src/app/books/book-collection.spec.ts`.
  A missing browser executable or runner dependency is a setup gap, not evidence of Red. Keep machine paths out of
  committed configuration.

## Jasmine unit example

For a scenario whose agreed behavior is title-prefix matching for a one-letter query, a prospective
`src/app/books/book-collection.spec.ts` can check the existing public collection projection. Create a typed fixture
locally; do not import a Playwright fixture module into a Jasmine runner.

```ts
import { Book } from './book';
import { defaultFilters, selectBooks } from './book-collection';
import { emptyLibrary } from './book-library';

describe('[R1] One-letter title search', () => {
  it('includes title starts and excludes a later matching letter', () => {
    // Given
    const base: Book = {
      id: 'java',
      isbn: 'example-isbn',
      title: 'JavaScript',
      author: 'Example Author',
      publisher: 'Example Press',
      numPages: 200,
      price: '$10',
      cover: '',
      abstract: '',
      userId: 1
    };
    const catalogue = [base, { ...base, id: 'node', title: 'Node.js' }];

    // When
    const result = selectBooks(catalogue, emptyLibrary(), {
      ...defaultFilters,
      search: 'j',
      view: 'all',
      limit: 10
    });

    // Then
    expect(result.books.map(book => book.title)).toEqual(['JavaScript']);
  });
});
```

For components/services, use the existing Angular TestBed conventions and replace only external dependencies. Do not
invent a new production method solely to give a generated unit test something to import.

## Playwright UI example

A prospective `tests/search.spec.ts` verifies the same acceptance outcome through the user-facing search field. The
fixture supplies catalogue data; application code still performs the search.

```ts
import { appUrl, book, expect, mockBooks, test } from './book-fixtures';

test('[R1] One-letter search excludes titles with the letter later in the title', async ({ page }) => {
  // Given
  await mockBooks(page, [
    { ...book, id: 'java', title: 'JavaScript' },
    { ...book, id: 'node', title: 'Node.js' }
  ]);
  await page.goto(appUrl);
  await expect(page.getByRole('link', { name: 'Node.js', exact: true })).toBeVisible();

  // When
  await page.getByRole('textbox', { name: 'Search books', exact: true }).fill('j');

  // Then
  await expect(page.getByRole('link', { name: 'JavaScript', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Node.js', exact: true })).toHaveCount(0);
});
```

Use the actual agreed persistence boundary in further scenarios. BookMonkey currently keeps edits, saved IDs, reading
statuses, and recently viewed IDs in this browser, with read-only catalogue HTTP access. Tests should interact through
the UI to create persisted state and reload when persistence is the criterion. Do not prepopulate the final result or
mock the feature's own save command to claim the persistence scenario works.
