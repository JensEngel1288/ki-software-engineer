import { apiHeaders, apiUrl, appUrl, book, expect, mockBooks, test } from './book-fixtures';

export const collection = [
  book,
  {
    ...book,
    id: 'javascript',
    title: 'JavaScript Basics',
    author: 'Charlie',
    publisher: 'Sample House',
    numPages: 120
  },
  { ...book, id: 'learning', title: 'Learning Java', author: 'Bob', numPages: 320 },
  { ...book, id: 'node', title: 'Node.js Guide', author: 'Alice', publisher: 'Sample House', numPages: 180 },
  { ...book, id: 'alpha', title: 'Alpha Stories', author: 'Java Author', publisher: 'Other', numPages: 50 },
  { ...book, id: 'jquery', title: 'jQuery Patterns', author: 'Zoe', numPages: 200 },
  { ...book, id: 'cpp', title: 'C++ Primer', author: 'Dennis', publisher: 'Other', numPages: 900 }
];

test('catalogue failures show a local retry and are reported once', async ({ page, errorReports }) => {
  let attempts = 0;
  await page.route(apiUrl, route => {
    attempts++;
    return route.fulfill({
      status: attempts === 1 ? 503 : 200,
      json: attempts === 1 ? {} : [book],
      headers: apiHeaders
    });
  });
  await page.goto(appUrl);
  await expect(page.getByRole('alert')).toContainText('Unable to load books');
  await expect.poll(() => errorReports.length).toBe(1);
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByRole('link', { name: book.title, exact: true })).toBeVisible();
  expect(attempts).toBe(2);
});

test('one-letter search matches title starts, not other fields or later letters', async ({ page }) => {
  await mockBooks(page, collection);
  await page.goto(appUrl);
  await page.getByLabel('Search books', { exact: true }).fill(' j ');
  await expect(page.locator('app-book-item h2')).toHaveText(['JavaScript Basics', 'jQuery Patterns']);
});

test('longer searches match literal title text anywhere', async ({ page }) => {
  await mockBooks(page, collection);
  await page.goto(appUrl);
  await page.getByLabel('Search books', { exact: true }).fill('JAVA');
  await expect(page.locator('app-book-item h2')).toHaveText(['JavaScript Basics', 'Learning Java']);
  await page.getByLabel('Search books', { exact: true }).fill('c++');
  await expect(page.locator('app-book-item h2')).toHaveText(['C++ Primer']);
});

test('sorts the collection by title or author in both directions', async ({ page }) => {
  await mockBooks(page, collection);
  await page.goto(appUrl);
  const titles = page.locator('app-book-item h2');
  await page.getByRole('combobox', { name: 'Sort books', exact: true }).selectOption('title-asc');
  await expect(titles).toHaveText([
    'Alpha Stories',
    book.title,
    'C++ Primer',
    'JavaScript Basics',
    'jQuery Patterns',
    'Learning Java',
    'Node.js Guide'
  ]);
  await page.getByRole('combobox', { name: 'Sort books', exact: true }).selectOption('title-desc');
  await expect(titles.first()).toHaveText('Node.js Guide');
  await page.getByRole('combobox', { name: 'Sort books', exact: true }).selectOption('author-asc');
  await expect(titles).toHaveText([
    book.title,
    'Node.js Guide',
    'Learning Java',
    'JavaScript Basics',
    'C++ Primer',
    'Alpha Stories',
    'jQuery Patterns'
  ]);
  await page.getByRole('combobox', { name: 'Sort books', exact: true }).selectOption('author-desc');
  await expect(titles.first()).toHaveText('jQuery Patterns');
});

test('combines author, publisher and inclusive page filters and resets them', async ({ page }) => {
  await mockBooks(page, collection);
  await page.goto(appUrl);
  await page.getByLabel('Filter by author', { exact: true }).fill('ALI');
  await page.getByLabel('Filter by publisher', { exact: true }).fill('sample');
  await page.getByLabel('Minimum pages', { exact: true }).fill('180');
  await page.getByLabel('Maximum pages', { exact: true }).fill('180');
  await expect(page.locator('app-book-item h2')).toHaveText(['Node.js Guide']);
  await page.getByLabel('Minimum pages', { exact: true }).fill('181');
  await expect(page.getByRole('alert')).toContainText('Minimum pages must not exceed maximum pages');
  await expect(page.locator('app-book-item')).toHaveCount(0);
  await page.getByRole('button', { name: 'Reset filters' }).click();
  await expect(page.locator('app-book-item')).toHaveCount(collection.length);
});

test('[SF3] clearing numeric bounds restores unbounded filtering after parent updates', async ({ page }) => {
  await mockBooks(page, collection);
  await page.goto(appUrl);
  const titles = page.locator('app-book-item h2');
  const minimum = page.getByLabel('Minimum pages', { exact: true });
  const maximum = page.getByLabel('Maximum pages', { exact: true });
  await maximum.fill('180');
  await expect(titles).toHaveText(collection.filter(book => book.numPages <= 180).map(book => book.title));
  await maximum.fill('');
  await expect(titles).toHaveText(collection.map(book => book.title));
  await minimum.fill('240');
  await expect(titles).toHaveText(collection.filter(book => book.numPages >= 240).map(book => book.title));
  await minimum.fill('');
  await expect(titles).toHaveText(collection.map(book => book.title));
  await page.getByLabel('Filter by author', { exact: true }).fill('Alice');
  await expect(titles).toHaveText(['Node.js Guide']);
  await page.getByRole('button', { name: 'Reset filters', exact: true }).click();
  await expect(titles).toHaveText(collection.map(book => book.title));
  await expect(minimum).toHaveValue('');
  await expect(maximum).toHaveValue('');
  await expect(page.getByLabel('Filter by author', { exact: true })).toHaveValue('');
});

test('debounces typing, replaces pending terms and clears without extra API requests', async ({ page }) => {
  await mockBooks(page, collection);
  const requests: string[] = [];
  page.on('request', request => {
    if (request.url() === apiUrl) requests.push(request.url());
  });
  await page.goto(appUrl);
  await expect(page.locator('app-book-item')).toHaveCount(collection.length);
  await page.clock.install();
  await page.getByLabel('Search books', { exact: true }).fill('python');
  await page.getByLabel('Search books', { exact: true }).fill('java');
  await page.clock.runFor(300);
  await expect(page.locator('app-book-item h2')).toHaveText(['JavaScript Basics', 'Learning Java']);
  await page.getByLabel('Search books', { exact: true }).fill('pending');
  await page.getByRole('button', { name: 'Clear search', exact: true }).click();
  await expect(page.locator('app-book-item')).toHaveCount(collection.length);
  await page.clock.runFor(600);
  await expect(page.locator('app-book-item')).toHaveCount(collection.length);
  expect(requests).toHaveLength(1);
});

test('[P1] searches the full catalogue before paginating visible results', async ({ page }) => {
  const books = Array.from({ length: 12 }, (_, index) => ({
    ...book,
    id: String(index),
    title: index === 11 ? 'Java Beyond The First Page' : 'Alpha ' + index
  }));
  await mockBooks(page, books);
  await page.goto(appUrl);
  await expect(page.locator('app-book-item')).toHaveCount(10);
  await page.getByRole('button', { name: 'Next page', exact: true }).click();
  await expect(page.locator('app-book-item')).toHaveCount(2);
  await page.getByLabel('Search books', { exact: true }).fill('j');
  await expect(page.locator('app-book-item h2')).toHaveText(['Java Beyond The First Page']);
});

test('[P2] navigates numbered pages with correct bounds and no extra catalogue requests', async ({ page }) => {
  const books = Array.from({ length: 23 }, (_, index) => ({
    ...book,
    id: `page-${index}`,
    title: `Book ${index + 1}`
  }));
  await mockBooks(page, books);
  let requests = 0;
  page.on('request', request => {
    if (request.url() === apiUrl) requests++;
  });
  await page.goto(appUrl);
  const titles = page.locator('app-book-item h2');
  await expect(titles).toHaveText(books.slice(0, 10).map(book => book.title));
  await expect(page.getByRole('button', { name: 'Previous page', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Next page', exact: true }).click();
  await expect(titles).toHaveText(books.slice(10, 20).map(book => book.title));
  await page.getByRole('combobox', { name: 'Go to page', exact: true }).selectOption('3');
  await expect(titles).toHaveText(books.slice(20).map(book => book.title));
  await expect(page.getByRole('button', { name: 'Next page', exact: true })).toBeDisabled();
  await expect(page.getByText('Page 3 of 3', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Previous page', exact: true }).click();
  await expect(titles).toHaveText(books.slice(10, 20).map(book => book.title));
  expect(requests).toBe(1);
});

test('[P3] queries reset the page while Universe continues to show all matches', async ({ page }) => {
  const books = Array.from({ length: 23 }, (_, index) => ({
    ...book,
    id: `query-${index}`,
    title: `Title ${index + 1}`
  }));
  await mockBooks(page, books);
  await page.goto(appUrl);
  await page.getByRole('combobox', { name: 'Go to page', exact: true }).selectOption('3');
  await page.getByRole('tab', { name: 'Universe', exact: true }).click();
  await expect(page.getByRole('button', { name: /^Select book:/ })).toHaveCount(23);
  await page.getByRole('tab', { name: 'Gallery', exact: true }).click();
  await expect(page.getByText('Page 3 of 3', { exact: true })).toBeVisible();
  await page.getByRole('combobox', { name: 'Sort books', exact: true }).selectOption('title-desc');
  await expect(page.getByText('Page 1 of 3', { exact: true })).toBeVisible();
  await page.getByRole('combobox', { name: 'Go to page', exact: true }).selectOption('2');
  await page.getByLabel('Search books', { exact: true }).fill('Title 23');
  await expect(page.locator('app-book-item h2')).toHaveText(['Title 23']);
  await expect(page.getByText('Page 1 of 1', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Clear search', exact: true }).click();
  await expect(page.getByText('Page 1 of 3', { exact: true })).toBeVisible();
});

test('[P4] removing the final item on a saved page clamps to a remaining page', async ({ page }) => {
  const books = Array.from({ length: 11 }, (_, index) => ({
    ...book,
    id: `saved-${index}`,
    title: `Saved ${index + 1}`
  }));
  await mockBooks(page, books);
  await page.addInitScript(
    ids => {
      localStorage.setItem(
        'bookmonkey-library-v1',
        JSON.stringify({ savedIds: ids, readingStatuses: {}, recentIds: [], edits: {} })
      );
    },
    books.map(book => book.id)
  );
  await page.goto(appUrl);
  await page.getByRole('button', { name: 'Read later', exact: true }).click();
  await page.getByRole('button', { name: 'Next page', exact: true }).click();
  await expect(page.locator('app-book-item')).toHaveCount(1);
  await page.getByRole('button', { name: 'Remove from read later', exact: true }).click();
  await expect(page.locator('app-book-item')).toHaveCount(10);
  await expect(page.getByText('Page 1 of 1', { exact: true })).toBeVisible();
});

test('leaving the list tears down pending typing work', async ({ page }) => {
  await page.goto(appUrl + '/books/' + book.id);
  await page.getByRole('link', { name: 'Back to books' }).click();
  await expect(page.locator('app-book-item')).toHaveCount(1);
  await page.clock.install();
  await page.getByLabel('Search books', { exact: true }).fill('pending');
  await page.goBack();
  await page.clock.runFor(600);
  await expect(page.getByRole('article')).toBeVisible();
});

test('both card and detail views handle a broken cover', async ({ page }) => {
  await page.route(book.cover, route => route.fulfill({ status: 404, body: '' }));
  await page.goto(appUrl);
  await expect(page.getByText('No cover available', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: book.title, exact: true }).click();
  await expect(page.getByText('No cover available', { exact: true })).toBeVisible();
});

test('[REC1] home recommendation tile opens a monthly feature by keyboard and links to the book', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-13T12:00:00Z'));
  await page.goto(appUrl);
  const shortcut = page.getByRole('link', { name: 'Reading recommendation', exact: true });
  await expect(shortcut).toHaveAttribute('href', '/recommendation');
  await expect(shortcut.locator('svg').first()).toBeVisible();
  await shortcut.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(appUrl + '/recommendation');
  await expect(page.getByRole('heading', { name: 'Reading recommendation of the month', exact: true })).toBeVisible();
  await expect(page.getByText('November 2026', { exact: true })).toBeVisible();
  const feature = page.getByRole('article');
  await expect(feature.getByRole('heading', { name: book.title, exact: true })).toBeVisible();
  for (const value of [book.author, book.publisher, book.price, book.abstract.split('\n')[0]])
    await expect(feature).toContainText(value);
  await expect(feature.getByRole('img', { name: book.title, exact: true })).toBeVisible();
  await expect(feature.getByRole('link', { name: 'Open book details', exact: true })).toHaveAttribute(
    'href',
    '/books/' + book.id
  );
  await page.getByRole('link', { name: 'Back to books', exact: true }).click();
  await expect(page).toHaveURL(appUrl + '/');
});

test('[REC2] monthly selection ignores filters and API ordering while applying browser edits', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-13T12:00:00Z'));
  const books = [{ ...book, id: 'zeta', title: 'Zeta Book' }, book, { ...book, id: 'alpha', title: 'Alpha Book' }];
  await mockBooks(page, books);
  await page.addInitScript(
    ({ id, edits }) => {
      localStorage.setItem(
        'bookmonkey-library-v1',
        JSON.stringify({ savedIds: [], readingStatuses: {}, recentIds: [], edits: { [id]: edits } })
      );
    },
    {
      id: book.id,
      edits: {
        title: 'Edited monthly pick',
        subtitle: book.subtitle,
        author: book.author,
        publisher: book.publisher,
        isbn: book.isbn,
        numPages: book.numPages,
        price: book.price,
        cover: book.cover,
        abstract: book.abstract
      }
    }
  );
  await page.goto(appUrl);
  await page.getByLabel('Search books', { exact: true }).fill('no matches here');
  await expect(page.locator('app-book-item')).toHaveCount(0);
  await page.getByRole('link', { name: 'Reading recommendation', exact: true }).click();
  await expect(
    page.getByRole('article').getByRole('heading', { name: 'Edited monthly pick', exact: true })
  ).toBeVisible();
  await mockBooks(page, [...books].reverse());
  await page.reload();
  await expect(page.getByRole('link', { name: 'Open book details', exact: true })).toHaveAttribute(
    'href',
    '/books/' + book.id
  );
  await expect(page.getByRole('article')).toContainText('Edited monthly pick');
  await page.clock.setFixedTime(new Date('2026-12-13T12:00:00Z'));
  await page.reload();
  await expect(page.getByText('December 2026', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open book details', exact: true })).toHaveAttribute(
    'href',
    '/books/zeta'
  );
});

test('[REC3] a browser-created book participates when the API collection is empty', async ({ page }) => {
  await mockBooks(page, []);
  await page.goto(appUrl + '/books/new');
  await page.getByLabel('Title', { exact: true }).fill('My local discovery');
  await page.getByLabel(/^Page count/).fill('123');
  await page.getByRole('button', { name: 'Create book', exact: true }).click();
  await expect(page).toHaveURL(/\/books\/local-[^/]+$/);
  const localUrl = page.url();
  await page.goto(appUrl + '/recommendation');
  await expect(
    page.getByRole('article').getByRole('heading', { name: 'My local discovery', exact: true })
  ).toBeVisible();
  await expect(page.getByText('Price not listed', { exact: true })).toBeVisible();
  await expect(page.getByText('No description available.', { exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole('link', { name: 'Open book details', exact: true }).click();
  await expect(page).toHaveURL(localUrl);
});

test('[REC4] recommendation errors retry and an empty collection offers creation', async ({ page, errorReports }) => {
  let attempts = 0;
  await page.route(apiUrl, route =>
    route.fulfill({ status: ++attempts === 1 ? 503 : 200, json: attempts === 1 ? {} : [book], headers: apiHeaders })
  );
  await page.goto(appUrl + '/recommendation');
  await expect(page.getByRole('heading', { name: 'Unable to load recommendation', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(page.getByRole('article')).toContainText(book.title);
  expect(errorReports).toHaveLength(1);
  await mockBooks(page, []);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'No recommendation yet', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Add book', exact: true }).click();
  await expect(page).toHaveURL(appUrl + '/books/new');
});

test('[REC5] recommendation shows loading until its catalogue is ready', async ({ page }) => {
  let release!: () => void;
  const ready = new Promise<void>(resolve => {
    release = resolve;
  });
  await page.route(apiUrl, async route => {
    await ready;
    await route.fulfill({ json: [book], headers: apiHeaders });
  });
  await page.goto(appUrl + '/recommendation');
  try {
    await expect(page.getByRole('status')).toContainText('Finding your next read...');
  } finally {
    release();
  }
  await expect(page.getByRole('article')).toContainText(book.title);
});

for (const theme of ['light', 'dark'] as const) {
  test(`[REC6] recommendation fits 320px in ${theme} and personal actions persist without API writes`, async ({
    page
  }) => {
    await page.setViewportSize({ width: 320, height: 760 });
    await page.emulateMedia({ colorScheme: theme });
    await mockBooks(page, [{ ...book, cover: '', abstract: '' }]);
    const writes: string[] = [];
    page.on('request', request => {
      if (request.url().startsWith(apiUrl) && request.method() !== 'GET') writes.push(request.method());
    });
    await page.goto(appUrl);
    await page.getByRole('link', { name: 'Reading recommendation', exact: true }).click();
    await expect(page.getByText('No cover available', { exact: true })).toBeVisible();
    await expect(page.getByText('No description available.', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Save for later', exact: true }).click();
    await page.getByRole('combobox', { name: 'Reading status for ' + book.title, exact: true }).selectOption('reading');
    await page.reload();
    await expect(page.getByRole('button', { name: 'Remove from read later', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    await expect(page.getByRole('combobox', { name: 'Reading status for ' + book.title, exact: true })).toHaveValue(
      'reading'
    );
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(theme === 'dark');
    expect(writes).toEqual([]);
  });
}
