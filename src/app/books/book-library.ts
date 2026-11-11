import { Book } from './book';

export type ReadingStatus = 'want-to-read' | 'reading' | 'finished';
export type BookEdits = Pick<
  Book,
  'title' | 'subtitle' | 'author' | 'publisher' | 'isbn' | 'numPages' | 'price' | 'cover' | 'abstract'
>;

export interface BookLibrary {
  savedIds: string[];
  readingStatuses: Record<string, ReadingStatus>;
  recentIds: string[];
  edits: Record<string, BookEdits>;
}

export const readingStatuses: ReadingStatus[] = ['want-to-read', 'reading', 'finished'];

export function emptyLibrary(): BookLibrary {
  return { savedIds: [], readingStatuses: {}, recentIds: [], edits: {} };
}

export function applyBookEdits(book: Book, library: BookLibrary): Book {
  return { ...book, ...library.edits[book.id] };
}

export function isBookEdits(value: unknown): value is BookEdits {
  if (!value || typeof value !== 'object') return false;
  const fields = value as Record<string, unknown>;
  return (
    ['title', 'author', 'publisher', 'isbn', 'price', 'cover', 'abstract'].every(
      key => typeof fields[key] === 'string'
    ) &&
    (fields['subtitle'] === undefined || typeof fields['subtitle'] === 'string') &&
    typeof fields['numPages'] === 'number' &&
    Number.isInteger(fields['numPages']) &&
    fields['numPages'] > 0 &&
    typeof fields['title'] === 'string' &&
    fields['title'].trim().length > 0
  );
}

export function parseLibrary(value: unknown): BookLibrary {
  if (!value || typeof value !== 'object') throw new Error('Invalid saved library');
  const record = value as Record<string, unknown>;
  const ids = (items: unknown): string[] =>
    Array.isArray(items) ? [...new Set(items.filter((id): id is string => typeof id === 'string'))] : [];
  const statuses = record['readingStatuses'];
  const edits = record['edits'];
  return {
    savedIds: ids(record['savedIds']),
    recentIds: ids(record['recentIds']),
    readingStatuses:
      statuses && typeof statuses === 'object'
        ? Object.fromEntries(
            Object.entries(statuses).filter(([, status]) => readingStatuses.includes(status as ReadingStatus))
          )
        : {},
    edits:
      edits && typeof edits === 'object'
        ? Object.fromEntries(Object.entries(edits).filter(([, entry]) => isBookEdits(entry)))
        : {}
  };
}
