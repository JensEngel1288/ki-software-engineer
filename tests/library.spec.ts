import { apiUrl, appUrl, book, expect, mockBooks, test } from './book-fixtures';

test('read-later membership survives reload and can be removed', async ({ page }) => {
  await page.goto(appUrl);
  await page.getByRole('button', { name: 'Save for later', exact: true }).click();
  await page.getByRole('button', { name: 'Read later', exact: true }).click();
  await expect(page.locator('app-book-item')).toHaveCount(1);
  await page.reload();
  await page.getByRole('button', { name: 'Read later', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Remove from read later' })).toBeVisible();
  await page.getByRole('button', { name: 'Remove from read later' }).click();
  await expect(page.getByRole('heading', { name: 'No saved books yet' })).toBeVisible();
});

test('reading statuses persist and filter the collection', async ({ page }) => {
  await page.goto(appUrl);
  const status = page.getByRole('combobox', { name: 'Reading status for ' + book.title, exact: true });
  for (const value of ['want-to-read', 'reading', 'finished']) {
    await status.selectOption(value);
    await page.reload();
    await expect(status).toHaveValue(value);
  }
  await page.getByRole('combobox', { name: 'Filter by reading status', exact: true }).selectOption('reading');
  await expect(page.locator('app-book-item')).toHaveCount(0);
  await page.getByRole('combobox', { name: 'Filter by reading status', exact: true }).selectOption('finished');
  await expect(page.locator('app-book-item')).toHaveCount(1);
  await status.selectOption('');
  await expect(page.locator('app-book-item')).toHaveCount(0);
});

test('recently viewed books are unique, newest first, and persist', async ({ page }) => {
  const second = { ...book, id: 'second', title: 'Second Book' };
  await mockBooks(page, [book, second]);
  for (const selected of [book, second, book]) {
    await page.goto(appUrl + '/books/' + selected.id);
    await expect(page.getByRole('article')).toBeVisible();
  }
  await page.getByRole('link', { name: 'Back to books' }).click();
  await page.getByRole('button', { name: 'Recently viewed', exact: true }).click();
  await expect(page.locator('app-book-item h2')).toHaveText([book.title, second.title]);
  await page.reload();
  await page.getByRole('button', { name: 'Recently viewed', exact: true }).click();
  await expect(page.locator('app-book-item h2')).toHaveText([book.title, second.title]);
});

test('edits persist locally, keep the ID stable, and affect search and filters without API writes', async ({
  page,
  browser
}) => {
  const writes: string[] = [];
  page.on('request', request => {
    if (request.url().startsWith(apiUrl) && request.method() !== 'GET') writes.push(request.method());
  });
  await page.goto(appUrl + '/books/' + book.id + '/edit');
  await page.getByLabel('Title', { exact: true }).fill('Zebra Local Edition');
  await page.getByLabel('Author', { exact: true }).fill('Zed Reader');
  await page.getByLabel('Publisher', { exact: true }).fill('Local Press');
  await page.getByLabel('ISBN', { exact: true }).fill('LOCAL-ISBN');
  await page.getByLabel(/^Page count/).fill('321');
  await page.getByLabel(/^Price/).fill('$9.50');
  await page.getByLabel('Description', { exact: true }).fill('My local description');
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(page).toHaveURL(appUrl + '/books/' + book.id);
  await expect(page.getByRole('heading', { name: 'Zebra Local Edition', exact: true })).toBeVisible();
  await expect(page.getByRole('article')).toContainText('LOCAL-ISBN');
  await expect(page.getByRole('article')).toContainText('My local description');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Zebra Local Edition', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Back to books' }).click();
  await page.getByLabel('Search books', { exact: true }).fill('z');
  await page.getByLabel('Filter by author', { exact: true }).fill('Zed');
  await page.getByLabel('Filter by publisher', { exact: true }).fill('Local');
  await page.getByLabel('Minimum pages', { exact: true }).fill('321');
  await expect(page.locator('app-book-item h2')).toHaveText(['Zebra Local Edition']);
  expect(writes).toEqual([]);
  const isolated = await browser.newContext();
  try {
    const otherPage = await isolated.newPage();
    await mockBooks(otherPage, [book]);
    await otherPage.goto(appUrl);
    await expect(otherPage.getByRole('link', { name: book.title, exact: true })).toBeVisible();
    await expect(otherPage.getByRole('link', { name: 'Zebra Local Edition', exact: true })).toHaveCount(0);
  } finally {
    await isolated.close();
  }
});

test('cancel discards the editing draft and validation rejects empty titles or invalid page counts', async ({
  page
}) => {
  await page.goto(appUrl + '/books/' + book.id + '/edit');
  const save = page.getByRole('button', { name: 'Save changes', exact: true });
  await page.getByLabel('Title', { exact: true }).fill(' ');
  await expect(save).toBeDisabled();
  await page.getByLabel('Title', { exact: true }).fill('Unsaved draft');
  await page.getByLabel(/^Page count/).fill('1.5');
  await expect(save).toBeDisabled();
  await page.getByLabel(/^Page count/).fill('0');
  await expect(save).toBeDisabled();
  await page.getByLabel(/^Page count/).fill('100');
  await expect(save).toBeEnabled();
  await page.getByRole('link', { name: 'Cancel', exact: true }).click();
  await expect(page.getByRole('heading', { name: book.title, exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Unsaved draft', exact: true })).toHaveCount(0);
});

test('an edit route has a not-found state and direct reload keeps the form usable', async ({ page }) => {
  await page.goto(appUrl + '/books/missing/edit');
  await expect(page.getByRole('heading', { name: 'Book not found' })).toBeVisible();
  await page.goto(appUrl + '/books/' + book.id + '/edit');
  await page.reload();
  await expect(page.getByLabel('Title', { exact: true })).toHaveValue(book.title);
});

test('storage failures keep changes usable and disclose their temporary persistence', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new Error('Storage full');
    };
  });
  await page.goto(appUrl + '/books/' + book.id + '/edit');
  await page.getByLabel('Title', { exact: true }).fill('Temporary Local Title');
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Temporary Local Title', exact: true })).toBeVisible();
  await expect(page.getByRole('alert')).toContainText('available for this visit only');
});

test('personal controls and editor fit a narrow screen in dark mode', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto(appUrl);
  await expect(page.getByRole('button', { name: 'Save for later', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  await page.getByRole('link', { name: 'Edit ' + book.title, exact: true }).click();
  await expect(page.getByRole('button', { name: 'Save changes' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
});
