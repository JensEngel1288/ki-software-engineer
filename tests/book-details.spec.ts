import { apiHeaders, apiUrl, appUrl, book, expect, test } from './book-fixtures';

test('opens book details through the title link and returns to the collection', async ({ page }) => {
  await page.goto(appUrl);
  const titleLink = page.getByRole('link', { name: book.title, exact: true });
  await expect(titleLink).toHaveAttribute('href', `/books/${book.id}`);
  await titleLink.focus();
  await page.keyboard.press('Enter');

  await expect(page).toHaveURL(`${appUrl}/books/${book.id}`);
  const details = page.getByRole('article');
  await expect(details.getByRole('heading', { name: book.title, exact: true })).toBeVisible();
  for (const text of [book.subtitle!, `by ${book.author}`, book.isbn, book.publisher, `${book.numPages}`, book.price]) {
    await expect(details.getByText(text, { exact: true })).toBeVisible();
  }
  await expect(details).toContainText('A practical guide to Angular.');
  await expect(details).toContainText('Includes routing and HTTP requests.');
  await expect(details.getByRole('img', { name: book.title })).toHaveJSProperty('naturalWidth', 120);

  await page.getByRole('link', { name: 'Back to books' }).click();
  await expect(page).toHaveURL(`${appUrl}/`);
  await expect(page.getByRole('heading', { name: 'Book Collection', exact: true })).toBeVisible();
});

test('fetches a book on direct navigation and after a browser reload', async ({ page }) => {
  let requests = 0;
  page.on('request', request => {
    if (request.url() === `${apiUrl}/${book.id}`) {
      requests++;
    }
  });

  await page.goto(`${appUrl}/books/${book.id}`);
  await expect(page.getByRole('heading', { name: book.title, exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: book.title, exact: true })).toBeVisible();
  expect(requests).toBe(2);
});

test('shows a loading status until the book arrives', async ({ page }) => {
  let releaseResponse!: () => void;
  const responseGate = new Promise<void>(resolve => {
    releaseResponse = resolve;
  });
  await page.route(`${apiUrl}/${book.id}`, async route => {
    await responseGate;
    await route.fulfill({ json: book, headers: apiHeaders });
  });

  try {
    await page.goto(`${appUrl}/books/${book.id}`);
    await expect(page.getByRole('status')).toHaveText('Loading book...');
    await expect(page.getByRole('article')).toHaveCount(0);
  } finally {
    releaseResponse();
  }
  await expect(page.getByRole('heading', { name: book.title, exact: true })).toBeVisible();
  await expect(page.getByRole('status')).toHaveCount(0);
});

test('shows a request error and retries successfully', async ({ page }) => {
  let attempts = 0;
  await page.route(`${apiUrl}/${book.id}`, async route => {
    attempts++;
    await route.fulfill({
      status: attempts === 1 ? 503 : 200,
      json: attempts === 1 ? {} : book,
      headers: apiHeaders
    });
  });

  await page.goto(`${appUrl}/books/${book.id}`);
  await expect(page.getByRole('alert')).toContainText('Unable to load book');
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByRole('heading', { name: book.title, exact: true })).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
  expect(attempts).toBe(2);
});

test('distinguishes missing books from request failures', async ({ page }) => {
  await page.goto(`${appUrl}/books/missing`);
  await expect(page.getByRole('heading', { name: 'Book not found' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Back to books' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Try again' })).toHaveCount(0);
  await expect(page.getByRole('article')).toHaveCount(0);
});

for (const coverState of ['missing', 'broken']) {
  test(`shows a fallback for a ${coverState} cover`, async ({ page }) => {
    await page.route(`${apiUrl}/${book.id}`, async route => {
      await route.fulfill({
        json: { ...book, cover: coverState === 'missing' ? '' : book.cover },
        headers: apiHeaders
      });
    });
    if (coverState === 'broken') {
      await page.route(book.cover, route => route.fulfill({ status: 404, body: '' }));
    }

    await page.goto(`${appUrl}/books/${book.id}`);
    await expect(page.getByText('No cover available', { exact: true })).toBeVisible();
    await expect(page.getByRole('img', { name: book.title })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: book.title, exact: true })).toBeVisible();
  });
}

test('fits a narrow screen and handles an absent subtitle', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.route(`${apiUrl}/${book.id}`, async route => {
    await route.fulfill({ json: { ...book, subtitle: undefined }, headers: apiHeaders });
  });

  await page.goto(`${appUrl}/books/${book.id}`);
  await expect(page.getByRole('heading', { name: book.title, exact: true })).toBeVisible();
  await expect(page.getByText(book.subtitle!, { exact: true })).toHaveCount(0);
  await expect(page.getByText(book.price, { exact: true })).toBeVisible();
  const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(hasHorizontalOverflow).toBe(false);
});
