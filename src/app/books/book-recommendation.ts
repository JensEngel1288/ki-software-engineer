import { Book } from './book';
import { defaultFilters, selectBooks } from './book-collection';
import { BookLibrary } from './book-library';

export function recommendBook(catalogue: Book[], library: BookLibrary, date: Date): Book | null {
  const { matchingBooks } = selectBooks(catalogue, library, {
    ...defaultFilters,
    search: '',
    view: 'all',
    limit: 1,
    page: 1
  });
  matchingBooks.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const monthIndex = date.getFullYear() * 12 + date.getMonth();
  return matchingBooks.length ? matchingBooks[monthIndex % matchingBooks.length] : null;
}
