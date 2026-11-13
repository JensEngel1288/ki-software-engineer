import { apiUrl, appUrl, book, expect, mockBooks, test } from './book-fixtures';
import type { Locator, Page } from '@playwright/test';

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

test('[C1] creates, reloads, edits and searches a browser-local book without API writes', async ({ page }) => {
  const mutations: string[] = [];
  const localRequests: string[] = [];
  page.on('request', request => {
    if (request.url().startsWith(apiUrl) && request.method() !== 'GET') mutations.push(request.method());
    if (request.url().startsWith(apiUrl + '/local-')) localRequests.push(request.url());
  });
  await page.goto(appUrl);
  await page.getByRole('link', { name: 'Add book', exact: true }).click();
  await expect(page).toHaveURL(appUrl + '/books/new');
  await page.getByLabel('Title', { exact: true }).fill('Local Field Guide');
  await page.getByLabel('Author', { exact: true }).fill('Local Reader');
  await page.getByLabel('Publisher', { exact: true }).fill('Browser Press');
  await page.getByLabel('ISBN', { exact: true }).fill('LOCAL-123');
  await page.getByLabel(/^Page count/).fill('123');
  await page.getByLabel(/^Price/).fill('€12.00');
  await page.getByLabel('Description', { exact: true }).fill('Only in this browser.');
  await page.getByRole('button', { name: 'Create book', exact: true }).click();
  await expect(page).toHaveURL(/\/books\/local-[^/]+$/);
  const stableUrl = page.url();
  await expect(page.getByRole('heading', { name: 'Local Field Guide', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('article')).toContainText('LOCAL-123');
  await expect(page.getByRole('article')).toContainText('Only in this browser.');
  await page.goto(stableUrl + '/edit');
  await expect(page.getByLabel('Title', { exact: true })).toHaveValue('Local Field Guide');
  await page.getByLabel('Title', { exact: true }).fill('Updated Local Field Guide');
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(page).toHaveURL(stableUrl);
  await page.getByRole('link', { name: 'Back to books', exact: true }).click();
  await page.getByLabel('Search books', { exact: true }).fill('local field');
  await page.getByLabel('Filter by author', { exact: true }).fill('Local Reader');
  await expect(page.locator('app-book-item h2')).toHaveText(['Updated Local Field Guide']);
  expect(mutations).toEqual([]);
  expect(localRequests).toEqual([]);
});

test('[C2] creation validates the draft and Cancel leaves the collection unchanged', async ({ page }) => {
  await page.goto(appUrl + '/books/new');
  const create = page.getByRole('button', { name: 'Create book', exact: true });
  await expect(create).toBeDisabled();
  await page.getByLabel('Title', { exact: true }).fill(' ');
  await page.getByLabel(/^Page count/).fill('123');
  await expect(create).toBeDisabled();
  await page.getByLabel('Title', { exact: true }).fill('Unsaved creation');
  for (const value of ['0', '-1', '1.5']) {
    await page.getByLabel(/^Page count/).fill(value);
    await expect(create).toBeDisabled();
  }
  await page.getByLabel(/^Page count/).fill('123');
  await expect(create).toBeEnabled();
  await page.getByRole('link', { name: 'Cancel', exact: true }).click();
  await expect(page).toHaveURL(appUrl + '/');
  await expect(page.locator('app-book-item h2')).toHaveText([book.title]);
});

test('[C3] equal ISBNs create distinct stable browser-local identities', async ({ page }) => {
  await createLocalBook(page, 'First Local');
  const first = page.url();
  await createLocalBook(page, 'Second Local');
  const second = page.url();
  expect(second).not.toBe(first);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Second Local', exact: true })).toBeVisible();
  await page.goto(first);
  await expect(page.getByRole('heading', { name: 'First Local', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Back to books', exact: true }).click();
  await expect(page.locator('app-book-item h2')).toHaveText(['Second Local', 'First Local', book.title]);
});

test('[C4] creation remains usable for the visit when persistence fails', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new Error('Storage full');
    };
  });
  await createLocalBook(page, 'Temporary Created Book');
  await expect(page.getByRole('heading', { name: 'Temporary Created Book', exact: true })).toBeVisible();
  await expect(page.getByRole('alert')).toContainText('available for this visit only');
  await page.getByRole('link', { name: 'Back to books', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Temporary Created Book', exact: true })).toBeVisible();
});

test('[K1] migrates existing statuses and keeps board controls and gallery statuses synchronized', async ({ page }) => {
  const second = { ...book, id: 'second-board', title: 'Second Board Book' };
  await mockBooks(page, [book, second]);
  await page.addInitScript(id => {
    if (!localStorage.getItem('bookmonkey-library-v1'))
      localStorage.setItem(
        'bookmonkey-library-v1',
        JSON.stringify({
          savedIds: [],
          readingStatuses: { [id]: 'reading' },
          recentIds: [],
          edits: {}
        })
      );
  }, book.id);
  await page.goto(appUrl);
  await page.getByRole('tab', { name: 'Gallery', exact: true }).focus();
  await page.keyboard.press('End');
  await expect(page.getByRole('tab', { name: 'Reading list', exact: true })).toBeFocused();
  await expect(
    boardColumn(page, 'Currently reading').getByRole('link', { name: book.title, exact: true })
  ).toBeVisible();
  await addToBoard(page, second.id);
  await expect(boardColumn(page, 'Want to read').getByRole('link', { name: second.title, exact: true })).toBeVisible();
  await page
    .getByRole('combobox', { name: 'Reading status for ' + second.title, exact: true })
    .selectOption('finished');
  await expect(boardColumn(page, 'Read').getByRole('link', { name: second.title, exact: true })).toBeVisible();
  await page.reload();
  await openBoard(page);
  await expect(boardColumn(page, 'Read').getByRole('link', { name: second.title, exact: true })).toBeVisible();
  await page.getByRole('tab', { name: 'Gallery', exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'Reading status for ' + second.title, exact: true })).toHaveValue(
    'finished'
  );
  await openBoard(page);
  await page.getByRole('button', { name: 'Remove ' + second.title + ' from reading list', exact: true }).click();
  await expect(boardColumn(page, 'Read').getByRole('listitem')).toHaveCount(0);
});

test('[K2] CDK drag moves cards between columns and persists the status without API writes', async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 1400 });
  const writes: string[] = [];
  page.on('request', request => {
    if (request.url().startsWith(apiUrl) && request.method() !== 'GET') writes.push(request.method());
  });
  await page.goto(appUrl);
  await openBoard(page);
  await addToBoard(page, book.id);
  await dragReadingCard(page, book.title, boardColumn(page, 'Currently reading').getByRole('list'));
  await expect(
    boardColumn(page, 'Currently reading').getByRole('listitem', { name: book.title, exact: true })
  ).toBeVisible();
  await dragReadingCard(page, book.title, boardColumn(page, 'Read').getByRole('list'));
  await expect(boardColumn(page, 'Read').getByRole('listitem', { name: book.title, exact: true })).toBeVisible();
  await page.reload();
  await openBoard(page);
  await expect(boardColumn(page, 'Read').getByRole('listitem', { name: book.title, exact: true })).toBeVisible();
  expect(writes).toEqual([]);
});

test('[K3] reordering cards within a column persists without duplicates or missing cards', async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 1600 });
  const books = [book, { ...book, id: 'board-b', title: 'Board B' }, { ...book, id: 'board-c', title: 'Board C' }];
  await mockBooks(page, books);
  await page.goto(appUrl);
  await openBoard(page);
  for (const selected of books) await addToBoard(page, selected.id);
  const want = boardColumn(page, 'Want to read');
  await expect(want.getByRole('listitem').getByRole('link')).toHaveText(books.map(book => book.title));
  await dragReadingCard(page, book.title, want.getByRole('listitem', { name: 'Board C', exact: true }));
  await expect(want.getByRole('listitem').getByRole('link')).toHaveText(['Board B', 'Board C', book.title]);
  await page.reload();
  await openBoard(page);
  await expect(want.getByRole('listitem').getByRole('link')).toHaveText(['Board B', 'Board C', book.title]);
});

for (const theme of ['light', 'dark'] as const) {
  test(`[K4] board fits 320px in ${theme} mode and remains usable with blocked storage`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 760 });
    await page.emulateMedia({ colorScheme: theme });
    await page.addInitScript(() => {
      Storage.prototype.setItem = () => {
        throw new Error('Storage blocked');
      };
    });
    await page.goto(appUrl);
    await openBoard(page);
    await addToBoard(page, book.id);
    await page.getByRole('combobox', { name: 'Reading status for ' + book.title, exact: true }).selectOption('reading');
    await expect(
      boardColumn(page, 'Currently reading').getByRole('link', { name: book.title, exact: true })
    ).toBeVisible();
    await expect(page.getByRole('alert')).toContainText('available for this visit only');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

async function createLocalBook(page: Page, title: string): Promise<void> {
  await page.goto(appUrl + '/books/new');
  await page.getByLabel('Title', { exact: true }).fill(title);
  await page.getByLabel('ISBN', { exact: true }).fill(book.isbn);
  await page.getByLabel(/^Page count/).fill('100');
  await page.getByRole('button', { name: 'Create book', exact: true }).click();
  await expect(page).toHaveURL(/\/books\/local-[^/]+$/);
}

async function openBoard(page: Page): Promise<void> {
  await page.getByRole('tab', { name: 'Reading list', exact: true }).click();
}

async function addToBoard(page: Page, id: string): Promise<void> {
  await page.getByRole('combobox', { name: 'Add book to reading list', exact: true }).selectOption(id);
  await page.getByRole('button', { name: 'Add to reading list', exact: true }).click();
}

function boardColumn(page: Page, name: string): Locator {
  return page.getByRole('region', { name, exact: true });
}

async function dragReadingCard(page: Page, title: string, target: Locator): Promise<void> {
  const handle = page.getByRole('button', { name: 'Move ' + title, exact: true });
  await handle.scrollIntoViewIfNeeded();
  await target.scrollIntoViewIfNeeded();
  const start = (await handle.boundingBox())!;
  const end = (await target.boundingBox())!;
  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
  await page.mouse.down();
  await page.mouse.move(start.x + start.width / 2 + 8, start.y + start.height / 2 + 8, { steps: 3 });
  await page.mouse.move(end.x + end.width / 2, end.y + end.height - 8, { steps: 20 });
  await page.mouse.up();
  await expect(page.locator('.cdk-drag-preview')).toHaveCount(0);
}
