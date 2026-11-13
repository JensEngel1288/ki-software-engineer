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
  createdBooks: Book[];
  readingOrder: Record<ReadingStatus, string[]>;
}

export const readingStatuses: ReadingStatus[] = ['want-to-read', 'reading', 'finished'];

export function emptyLibrary(): BookLibrary {
  return {
    savedIds: [],
    readingStatuses: {},
    recentIds: [],
    edits: {},
    createdBooks: [],
    readingOrder: emptyReadingOrder()
  };
}

export function emptyReadingOrder(): Record<ReadingStatus, string[]> {
  return { 'want-to-read': [], reading: [], finished: [] };
}

export function isReadingStatus(value: unknown): value is ReadingStatus {
  return readingStatuses.some(status => status === value);
}

function isLocalBook(value: unknown): value is Book {
  return (
    isBookEdits(value) &&
    'id' in value &&
    typeof value.id === 'string' &&
    value.id.startsWith('local-') &&
    'userId' in value &&
    typeof value.userId === 'number' &&
    Number.isInteger(value.userId)
  );
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
  const parsedStatuses: Record<string, ReadingStatus> =
    statuses && typeof statuses === 'object'
      ? Object.fromEntries(
          Object.entries(statuses).filter((entry): entry is [string, ReadingStatus] => isReadingStatus(entry[1]))
        )
      : {};
  const storedOrder = record['readingOrder'];
  const orderRecord = storedOrder && typeof storedOrder === 'object' ? (storedOrder as Record<string, unknown>) : {};
  const readingOrder = emptyReadingOrder();
  for (const status of readingStatuses) {
    const ordered = ids(orderRecord[status]).filter(id => parsedStatuses[id] === status);
    readingOrder[status] = [
      ...ordered,
      ...Object.keys(parsedStatuses).filter(id => parsedStatuses[id] === status && !ordered.includes(id))
    ];
  }
  const created = Array.isArray(record['createdBooks']) ? record['createdBooks'].filter(isLocalBook) : [];
  return {
    savedIds: ids(record['savedIds']),
    recentIds: ids(record['recentIds']),
    readingStatuses: parsedStatuses,
    readingOrder,
    createdBooks: [...new Map(created.map(book => [book.id, book])).values()],
    edits:
      edits && typeof edits === 'object'
        ? Object.fromEntries(Object.entries(edits).filter(([, entry]) => isBookEdits(entry)))
        : {}
  };
}
