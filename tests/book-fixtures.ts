import { test as base, expect, ConsoleMessage, Page } from '@playwright/test';
import type { Book } from '../src/app/books/book';

export const appUrl = 'http://localhost:4200';
export const apiUrl = 'http://localhost:4730/books';
export const apiHeaders = { 'access-control-allow-origin': '*' };
export const book: Book = {
  id: 'book-1',
  isbn: '9781234567890',
  title: 'Angular in Practice',
  subtitle: 'Building a book collection',
  author: 'Ada Example',
  publisher: 'Example Press',
  numPages: 240,
  price: '$29.99',
  cover: 'http://localhost:4730/covers/book-1.svg',
  abstract: 'A practical guide to Angular.\nIncludes routing and HTTP requests.',
  userId: 1
};

export const test = base.extend<{ errorReports: ConsoleMessage[] }>({
  page: async ({ page }, use) => {
    await page.route(/^http:\/\/localhost:4730\/books(?:\/|\?|$)/, async route => {
      const path = new URL(route.request().url()).pathname;
      if (path === '/books') {
        await route.fulfill({ json: [book], headers: apiHeaders });
      } else if (path === `/books/${book.id}`) {
        await route.fulfill({ json: book, headers: apiHeaders });
      } else {
        await route.fulfill({ status: 404, json: {}, headers: apiHeaders });
      }
    });
    await page.route('http://localhost:4730/covers/**', route =>
      route.fulfill({
        contentType: 'image/svg+xml',
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="160"><rect width="120" height="160" fill="lightblue"/></svg>'
      })
    );
    await use(page);
  },
  errorReports: async ({ page }, use) => {
    const reports: ConsoleMessage[] = [];
    page.on('console', message => {
      if (message.type() === 'error' && message.text().startsWith('BookMonkey error')) {
        reports.push(message);
      }
    });
    await use(reports);
  }
});

export async function mockBooks(page: Page, books: Book[]): Promise<void> {
  await page.route(/^http:\/\/localhost:4730\/books(?:\/|\?|$)/, async route => {
    if (route.request().method() !== 'GET') {
      await route.fulfill({ status: 405, json: {}, headers: apiHeaders });
      return;
    }
    const path = new URL(route.request().url()).pathname;
    const selected = books.find(item => '/books/' + encodeURIComponent(item.id) === path);
    await route.fulfill({
      status: path === '/books' || selected ? 200 : 404,
      json: path === '/books' ? books : (selected ?? {}),
      headers: apiHeaders
    });
  });
}

export { expect };
