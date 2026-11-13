import type { Book } from '../src/app/books/book';
import { apiHeaders, apiUrl, appUrl, book, expect, mockBooks, test } from './book-fixtures';

const catalogue: Book[] = [
  book,
  { ...book, id: 'javascript', title: 'JavaScript Basics', publisher: 'Sample House' },
  { ...book, id: 'learning-java', title: 'Learning Java', publisher: 'Sample House' },
  { ...book, id: 'node', title: 'Node.js Guide', author: 'Bea Reader', publisher: 'Other Press' },
  ...Array.from({ length: 12 }, (_, index) => ({
    ...book,
    id: `extra-${index}`,
    title: `Extra Book ${index + 1}`,
    author: `Author ${index % 3}`,
    publisher: `Publisher ${index % 2}`
  }))
];

test('SM1: display tabs support keyboard switching and preserve collection/search state', async ({ page }) => {
  await mockBooks(page, catalogue);
  await page.goto(appUrl);
  await page.getByLabel('Search books', { exact: true }).fill('java');
  await expect(page.locator('app-book-item')).toHaveCount(2);
  const gallery = page.getByRole('tab', { name: 'Gallery', exact: true });
  const universe = page.getByRole('tab', { name: 'Universe', exact: true });
  await gallery.focus();
  await page.keyboard.press('ArrowRight');
  await expect(universe).toBeFocused();
  await expect(universe).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tabpanel', { name: 'Universe', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Select book:/ })).toHaveCount(2);
  await page.keyboard.press('ArrowLeft');
  await expect(gallery).toBeFocused();
  await expect(page.locator('app-book-item')).toHaveCount(2);
  await expect(page.getByLabel('Search books', { exact: true })).toHaveValue('java');
  await page.getByRole('button', { name: 'Clear search', exact: true }).click();
  await page.locator('app-book-item').first().getByRole('button', { name: 'Save for later', exact: true }).click();
  await page.getByRole('button', { name: 'Read later', exact: true }).click();
  await universe.click();
  await expect(page.getByRole('button', { name: /^Select book:/ })).toHaveCount(1);
  await gallery.click();
  await expect(page.getByRole('button', { name: 'Read later', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('app-book-item')).toHaveCount(1);
});

test('SM2: the map includes all matching books before gallery limits, without extra catalogue requests', async ({
  page
}) => {
  const denseCatalogue = [
    ...catalogue,
    ...Array.from({ length: 250 - catalogue.length }, (_, index) => ({
      ...book,
      id: `dense-${index}`,
      title: `Catalogue Entry ${index + 1}`
    }))
  ];
  let requests = 0;
  page.on('request', request => {
    if (request.url() === apiUrl) requests++;
  });
  await mockBooks(page, denseCatalogue);
  await page.goto(appUrl);
  await expect(page.locator('app-book-item')).toHaveCount(10);
  await page.getByRole('tab', { name: 'Universe', exact: true }).click();
  const stars = page.getByRole('button', { name: /^Select book:/ });
  await expect(stars).toHaveCount(denseCatalogue.length);
  await expect(page.getByRole('button', { name: 'Show more books', exact: true })).toHaveCount(0);
  await page.getByLabel('Search books', { exact: true }).fill('j');
  await expect(stars).toHaveCount(1);
  await expect(stars.first()).toHaveAccessibleName('Select book: JavaScript Basics by Ada Example');
  await page.getByLabel('Search books', { exact: true }).fill('java');
  await expect(stars).toHaveCount(2);
  await page.getByLabel('Filter by publisher', { exact: true }).fill('sample');
  await page.getByRole('combobox', { name: 'Sort books', exact: true }).selectOption('title-desc');
  await expect(stars.first()).toHaveAccessibleName('Select book: Learning Java by Ada Example');
  await page.getByLabel('Minimum pages', { exact: true }).fill('241');
  await expect(page.getByRole('heading', { name: 'No books match your search' })).toBeVisible();
  expect(requests).toBe(1);
});

test('SM6: display tabs remain usable while the catalogue is loading', async ({ page }) => {
  let release!: () => void;
  const responseReady = new Promise<void>(resolve => {
    release = resolve;
  });
  await page.route(apiUrl, async route => {
    await responseReady;
    await route.fulfill({ json: catalogue, headers: apiHeaders });
  });
  await page.goto(appUrl);
  try {
    await page.getByRole('tab', { name: 'Universe', exact: true }).click();
    await expect(page.getByRole('status')).toContainText('Loading books...');
  } finally {
    release();
  }
  await expect(page.getByRole('group', { name: 'Interactive book star map', exact: true })).toBeVisible();
});

test('SM3: selecting stars and the native selector previews books and opens their stable detail route', async ({
  page
}) => {
  await mockBooks(page, catalogue);
  await page.goto(appUrl);
  await page.getByRole('tab', { name: 'Universe', exact: true }).click();
  const preview = page.getByRole('complementary', { name: 'Selected book', exact: true });
  await page.getByRole('button', { name: 'Select book: Node.js Guide by Bea Reader', exact: true }).click();
  await expect(preview.getByRole('heading', { name: 'Node.js Guide', exact: true })).toBeVisible();
  await expect(preview).toContainText('Bea Reader');
  await expect(preview).toContainText('Other Press');
  await expect(preview.getByRole('img', { name: 'Node.js Guide', exact: true })).toBeVisible();
  await page.getByRole('combobox', { name: 'Choose a book', exact: true }).selectOption('extra-11');
  await expect(preview.getByRole('heading', { name: 'Extra Book 12', exact: true })).toBeVisible();
  await expect(preview.getByRole('link', { name: 'Open book details', exact: true })).toHaveAttribute(
    'href',
    '/books/extra-11'
  );
  await preview.getByRole('link', { name: 'Open book details', exact: true }).click();
  await expect(page).toHaveURL(appUrl + '/books/extra-11');
  await expect(page.getByRole('article').getByRole('heading', { name: 'Extra Book 12', exact: true })).toBeVisible();
});

test('SM3: preview covers recover between books and collection changes preserve a valid selection', async ({
  page
}) => {
  const broken = { ...book, cover: 'http://localhost:4730/covers/broken.svg' };
  const healthy = { ...book, id: 'healthy', title: 'Healthy Cover', author: 'Bea Reader' };
  await mockBooks(page, [broken, healthy]);
  await page.route(broken.cover, route => route.abort());
  await page.goto(appUrl);
  await page.getByRole('tab', { name: 'Universe', exact: true }).click();
  const preview = page.getByRole('complementary', { name: 'Selected book', exact: true });
  const selector = page.getByRole('combobox', { name: 'Choose a book', exact: true });
  await expect(preview.getByText('No cover available', { exact: true })).toBeVisible();
  await selector.selectOption(healthy.id);
  const cover = preview.getByRole('img', { name: healthy.title, exact: true });
  await expect(cover).toBeVisible();
  await expect.poll(() => cover.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  await expect(preview.getByText('No cover available', { exact: true })).toHaveCount(0);
  await expect(page.getByLabel('Map zoom', { exact: true })).toHaveText('200%');

  await page.getByRole('combobox', { name: 'Sort books', exact: true }).selectOption('title-desc');
  await expect(page.getByLabel('Map zoom', { exact: true })).toHaveText('100%');
  await expect(selector).toHaveValue(healthy.id);
  await expect(preview.getByRole('heading', { name: healthy.title, exact: true })).toBeVisible();

  await page.getByLabel('Filter by author', { exact: true }).fill(book.author);
  await expect(selector).toHaveValue(broken.id);
  await expect(preview.getByRole('heading', { name: book.title, exact: true })).toBeVisible();
  await expect(preview.getByText('No cover available', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Select book:/ })).toHaveCount(1);
});

test('SM4: zoom, background dragging, Fit all, and keyboard star navigation work', async ({ page }) => {
  await mockBooks(page, catalogue);
  await page.goto(appUrl);
  await page.getByRole('tab', { name: 'Universe', exact: true }).click();
  const map = page.getByRole('group', { name: 'Interactive book star map', exact: true });
  await map.scrollIntoViewIfNeeded();
  const first = page.getByRole('button', { name: 'Select book: Angular in Practice by Ada Example', exact: true });
  const initial = await first.boundingBox();
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  await expect(page.getByLabel('Map zoom', { exact: true })).not.toHaveText('100%');
  await page.getByRole('button', { name: 'Fit all', exact: true }).click();
  await expect(page.getByLabel('Map zoom', { exact: true })).toHaveText('100%');
  const bounds = (await map.boundingBox())!;
  await page.mouse.move(bounds.x + 12, bounds.y + bounds.height - 15);
  await page.mouse.down();
  await page.mouse.move(bounds.x + 72, bounds.y + bounds.height - 45, { steps: 5 });
  await page.mouse.up();
  await expect.poll(() => first.boundingBox()).not.toEqual(initial);
  await page.getByRole('button', { name: 'Fit all', exact: true }).click();
  await first.focus();
  await page.keyboard.press('ArrowRight');
  const second = page.getByRole('button', { name: 'Select book: JavaScript Basics by Ada Example', exact: true });
  await expect(second).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('complementary', { name: 'Selected book' })).toContainText('JavaScript Basics');
});

test('SM5: constellation grouping switches between real publisher and author metadata', async ({ page }) => {
  await mockBooks(page, catalogue);
  await page.goto(appUrl);
  await page.getByRole('tab', { name: 'Universe', exact: true }).click();
  const map = page.getByRole('group', { name: 'Interactive book star map', exact: true });
  await expect(map).toContainText('Sample House');
  await page.getByRole('combobox', { name: 'Group constellations by', exact: true }).selectOption('author');
  await expect(map).toContainText('Bea Reader');
  await expect(map).not.toContainText('Sample House');
  await expect(page.getByRole('button', { name: /^Select book:/ })).toHaveCount(catalogue.length);
});

for (const theme of ['light', 'dark'] as const) {
  test(`SM6: map controls and preview fit 320px in ${theme} mode`, async ({ page, errorReports }) => {
    await page.setViewportSize({ width: 320, height: 760 });
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
    await mockBooks(page, catalogue);
    await page.goto(appUrl);
    await page.getByRole('tab', { name: 'Universe', exact: true }).click();
    await page.getByRole('button', { name: 'Rotate right', exact: true }).click();
    await page.getByRole('combobox', { name: 'Choose a book', exact: true }).selectOption('node');
    await expect(page.getByRole('complementary', { name: 'Selected book' })).toContainText('Node.js Guide');
    await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
    await page.getByRole('button', { name: 'Fit all', exact: true }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect(errorReports).toHaveLength(0);
  });
}

test('[3D1] orbit changes perspective positions and sizes while Fit all restores the overview', async ({ page }) => {
  await mockBooks(page, catalogue);
  await page.goto(appUrl);
  await page.getByRole('tab', { name: 'Universe', exact: true }).click();
  const stars = page.getByRole('button', { name: /^Select book:/ });
  await expect(stars).toHaveCount(catalogue.length);
  const sizes = await stars.evaluateAll(elements => elements.map(element => element.getBoundingClientRect().width));
  expect(Math.max(...sizes) - Math.min(...sizes)).toBeGreaterThan(1);
  const first = stars.first();
  const initial = (await first.boundingBox())!;
  const orientation = page.getByLabel('Camera orientation', { exact: true });
  const overview = await orientation.textContent();
  await page.getByRole('button', { name: 'Rotate right', exact: true }).click();
  await expect(orientation).not.toHaveText(overview!);
  await expect.poll(async () => (await first.boundingBox())!.width).not.toBeCloseTo(initial.width, 1);
  await expect(stars).toHaveCount(catalogue.length);
  await expect(page.getByRole('complementary', { name: 'Selected book' })).toContainText(book.title);
  await page.getByRole('button', { name: 'Fit all', exact: true }).click();
  await expect(orientation).toHaveText(overview!);
  const restored = (await first.boundingBox())!;
  expect(restored.x).toBeCloseTo(initial.x, 1);
  expect(restored.width).toBeCloseTo(initial.width, 1);
});

test('[3D2] pointer and keyboard orbit, native tilt, and regrouping preserve book selection', async ({ page }) => {
  await mockBooks(page, catalogue);
  await page.goto(appUrl);
  await page.getByRole('tab', { name: 'Universe', exact: true }).click();
  const map = page.getByRole('group', { name: 'Interactive book star map', exact: true });
  const orientation = page.getByLabel('Camera orientation', { exact: true });
  const overview = await orientation.textContent();
  await map.scrollIntoViewIfNeeded();
  const bounds = (await map.boundingBox())!;
  await page.mouse.move(bounds.x + 16, bounds.y + bounds.height - 20);
  await page.mouse.down();
  await page.mouse.move(bounds.x + 140, bounds.y + bounds.height - 65, { steps: 8 });
  await page.mouse.up();
  await expect(orientation).not.toHaveText(overview!);
  await page.getByRole('button', { name: 'Fit all', exact: true }).click();
  await map.focus();
  await page.keyboard.press('ArrowRight');
  await expect(orientation).not.toHaveText(overview!);
  const rotated = await orientation.textContent();
  await page.getByRole('button', { name: 'Tilt up', exact: true }).click();
  await expect(orientation).not.toHaveText(rotated!);
  await page.getByRole('combobox', { name: 'Group constellations by', exact: true }).selectOption('author');
  await expect(orientation).toHaveText(overview!);
  await page.getByRole('combobox', { name: 'Choose a book', exact: true }).selectOption('node');
  await expect(page.getByRole('complementary', { name: 'Selected book' })).toContainText('Node.js Guide');
});

test('[3D3] reduced motion stops ambient animation without disabling 3D controls', async ({ page, errorReports }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await mockBooks(page, catalogue);
  await page.goto(appUrl);
  await page.getByRole('tab', { name: 'Universe', exact: true }).click();
  await page.getByRole('button', { name: 'Rotate left', exact: true }).click();
  await page.getByRole('button', { name: 'Tilt down', exact: true }).click();
  const running = await page
    .locator('.cosmos')
    .evaluate(
      element => element.getAnimations({ subtree: true }).filter(animation => animation.playState === 'running').length
    );
  expect(running).toBe(0);
  await page.getByRole('button', { name: 'Fit all', exact: true }).click();
  await expect(page.getByLabel('Map zoom', { exact: true })).toHaveText('100%');
  expect(errorReports).toHaveLength(0);
});

test('SM6: Universe retains catalogue error/retry and explains empty matches', async ({ page }) => {
  let attempts = 0;
  await page.route(apiUrl, route => {
    attempts++;
    return route.fulfill({
      status: attempts === 1 ? 503 : 200,
      json: attempts === 1 ? {} : catalogue,
      headers: apiHeaders
    });
  });
  await page.goto(appUrl);
  await expect(page.getByRole('heading', { name: 'Unable to load books' })).toBeVisible();
  await page.getByRole('tab', { name: 'Universe', exact: true }).click();
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(page.getByRole('group', { name: 'Interactive book star map', exact: true })).toBeVisible();
  await page.getByLabel('Search books', { exact: true }).fill('no-such-book');
  await expect(page.getByRole('heading', { name: 'No books match your search' })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Select book:/ })).toHaveCount(0);
  await page.getByRole('button', { name: 'Clear search', exact: true }).click();
  await expect(page.getByRole('button', { name: /^Select book:/ })).toHaveCount(catalogue.length);
});
