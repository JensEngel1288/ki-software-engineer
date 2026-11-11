import { apiHeaders, apiUrl, appUrl, book, expect, test } from './book-fixtures';

test('a detail 404 stays local without a global report or notice', async ({ page, errorReports }) => {
  await page.goto(`${appUrl}/books/missing`);
  await expect(page.getByRole('heading', { name: 'Book not found' })).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
  expect(errorReports).toHaveLength(0);
});

test('a failed detail request reports once and retains its local retry UI', async ({ page, errorReports }) => {
  await page.route(`${apiUrl}/${book.id}`, route => route.fulfill({ status: 503, json: {}, headers: apiHeaders }));
  await page.goto(`${appUrl}/books/${book.id}`);
  await expect(page.getByRole('alert')).toHaveCount(1);
  await expect(page.getByRole('alert')).toContainText('Unable to load book');
  await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
  await expect.poll(() => errorReports.length).toBe(1);
  await expect(page.getByRole('heading', { name: 'Something went wrong' })).toHaveCount(0);
});

test('unhandled browser errors reach the root handler and are deduplicated', async ({ page, errorReports }) => {
  await page.goto(appUrl);
  await expect(page.getByRole('link', { name: book.title, exact: true })).toBeVisible();
  await page.evaluate(() => {
    const error = new Error('Controlled runtime failure');
    window.dispatchEvent(new ErrorEvent('error', { error, message: error.message }));
    window.dispatchEvent(new ErrorEvent('error', { error, message: error.message }));
  });
  await expect(page.getByRole('alert')).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'Something went wrong' })).toBeVisible();
  await expect.poll(() => errorReports.length).toBe(1);
  await page.getByRole('button', { name: 'Dismiss' }).click();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await page.getByRole('link', { name: book.title, exact: true }).click();
  await expect(page.getByRole('article')).toBeVisible();
});

test('a network failure reports once and can be retried locally', async ({ page, errorReports }) => {
  let attempts = 0;
  await page.route(`${apiUrl}/${book.id}`, route => {
    attempts++;
    return attempts === 1 ? route.abort('failed') : route.fulfill({ json: book, headers: apiHeaders });
  });
  await page.goto(`${appUrl}/books/${book.id}`);
  await expect(page.getByRole('alert')).toContainText('Unable to load book');
  await expect.poll(() => errorReports.length).toBe(1);
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByRole('article')).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
  expect(errorReports).toHaveLength(1);
});
