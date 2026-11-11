import { appUrl, book, expect, test } from './book-fixtures';

test.use({ colorScheme: 'light' });

test('keyboard switching changes colors and persists across navigation and reload', async ({ page }) => {
  await page.goto(appUrl);
  const toggle = page.getByRole('switch', { name: 'Dark mode' });
  await expect(toggle).toHaveAttribute('aria-checked', 'false');
  await expect(page.getByRole('link', { name: book.title, exact: true })).toBeVisible();
  const lightBackground = await page.locator('body').evaluate(element => getComputedStyle(element).backgroundColor);
  const lightCard = await page
    .locator('app-book-item > div')
    .evaluate(element => getComputedStyle(element).backgroundColor);
  await toggle.focus();
  await page.keyboard.press('Space');
  await expect(toggle).toHaveAttribute('aria-checked', 'true');
  expect(await page.locator('body').evaluate(element => getComputedStyle(element).backgroundColor)).not.toBe(
    lightBackground
  );
  expect(
    await page.locator('app-book-item > div').evaluate(element => getComputedStyle(element).backgroundColor)
  ).not.toBe(lightCard);
  await page.getByRole('link', { name: book.title, exact: true }).click();
  await page.reload();
  await expect(toggle).toHaveAttribute('aria-checked', 'true');
  await toggle.focus();
  await page.keyboard.press('Enter');
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.reload();
  await expect(toggle).toHaveAttribute('aria-checked', 'false');
  await page.setViewportSize({ width: 320, height: 720 });
  await expect(toggle).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
});

test('startup uses the system preference without persisting an explicit choice', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto(`${appUrl}/books/${book.id}`);
  await expect(page.getByRole('switch', { name: 'Dark mode' })).toHaveAttribute('aria-checked', 'true');
  expect(await page.evaluate(() => localStorage.getItem('bookmonkey-theme'))).toBeNull();
});

test('blocked storage does not prevent initialization or toggling', async ({ page }) => {
  const runtimeErrors: string[] = [];
  page.on('pageerror', error => runtimeErrors.push(error.message));
  await page.addInitScript(() => {
    Storage.prototype.getItem = Storage.prototype.setItem = () => {
      throw new Error('Storage unavailable');
    };
  });
  await page.goto(appUrl);
  const toggle = page.getByRole('switch', { name: 'Dark mode' });
  await expect(toggle).toHaveAttribute('aria-checked', 'false');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-checked', 'true');
  expect(runtimeErrors).toEqual([]);
});
