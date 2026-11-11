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

test('searches the full catalogue before limiting visible results', async ({ page }) => {
  const books = Array.from({ length: 12 }, (_, index) => ({
    ...book,
    id: String(index),
    title: index === 11 ? 'Java Beyond The First Page' : 'Alpha ' + index
  }));
  await mockBooks(page, books);
  await page.goto(appUrl);
  await expect(page.locator('app-book-item')).toHaveCount(10);
  await page.getByRole('button', { name: 'Show more books' }).click();
  await expect(page.locator('app-book-item')).toHaveCount(12);
  await page.getByLabel('Search books', { exact: true }).fill('j');
  await expect(page.locator('app-book-item h2')).toHaveText(['Java Beyond The First Page']);
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
