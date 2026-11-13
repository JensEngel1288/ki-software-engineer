import { Book } from './book';
import { applyBookEdits, BookLibrary, ReadingStatus } from './book-library';

export type CollectionView = 'all' | 'saved' | 'recent';
export type BookSort = 'default' | 'title-asc' | 'title-desc' | 'author-asc' | 'author-desc';

export interface BookFilters {
  author: string;
  publisher: string;
  minPages: number | null;
  maxPages: number | null;
  sort: BookSort;
  readingStatus: ReadingStatus | '';
}

export interface CollectionQuery extends BookFilters {
  search: string;
  view: CollectionView;
  limit: number;
  page: number;
}

export interface CollectionPage {
  books: Book[];
  matchingBooks: Book[];
  total: number;
  page: number;
  pageCount: number;
  library: BookLibrary;
}

export const defaultFilters: BookFilters = {
  author: '',
  publisher: '',
  minPages: null,
  maxPages: null,
  sort: 'default',
  readingStatus: ''
};

export function selectBooks(catalogue: Book[], library: BookLibrary, query: CollectionQuery): CollectionPage {
  const search = query.search.trim().toLocaleLowerCase();
  const author = query.author.trim().toLocaleLowerCase();
  const publisher = query.publisher.trim().toLocaleLowerCase();
  const localIds = new Set(library.createdBooks.map(book => book.id));
  const books = [...library.createdBooks, ...catalogue.filter(book => !localIds.has(book.id))]
    .map(book => applyBookEdits(book, library))
    .filter(book => {
      const title = book.title.toLocaleLowerCase();
      return (
        (!search || (Array.from(search).length === 1 ? title.startsWith(search) : title.includes(search))) &&
        (!author || book.author.toLocaleLowerCase().includes(author)) &&
        (!publisher || book.publisher.toLocaleLowerCase().includes(publisher)) &&
        (query.minPages === null || book.numPages >= query.minPages) &&
        (query.maxPages === null || book.numPages <= query.maxPages) &&
        (!query.readingStatus || library.readingStatuses[book.id] === query.readingStatus) &&
        (query.view !== 'saved' || library.savedIds.includes(book.id)) &&
        (query.view !== 'recent' || library.recentIds.includes(book.id))
      );
    });
  if (query.sort !== 'default') {
    const field = query.sort.startsWith('title') ? 'title' : 'author';
    const direction = query.sort.endsWith('desc') ? -1 : 1;
    books.sort(
      (a, b) => direction * a[field].localeCompare(b[field], undefined, { sensitivity: 'base', numeric: true })
    );
  } else if (query.view === 'recent') {
    books.sort((a, b) => library.recentIds.indexOf(a.id) - library.recentIds.indexOf(b.id));
  }
  const pageCount = Math.max(1, Math.ceil(books.length / query.limit));
  const page = Math.max(1, Math.min(query.page, pageCount));
  const offset = (page - 1) * query.limit;
  return {
    books: books.slice(offset, offset + query.limit),
    matchingBooks: books,
    total: books.length,
    page,
    pageCount,
    library
  };
}
