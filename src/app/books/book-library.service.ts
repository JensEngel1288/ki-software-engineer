import { DOCUMENT } from '@angular/common';
import { inject, Injectable, signal } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Book } from './book';
import {
  BookEdits,
  BookLibrary,
  emptyLibrary,
  emptyReadingOrder,
  isBookEdits,
  parseLibrary,
  ReadingStatus,
  readingStatuses
} from './book-library';

@Injectable({ providedIn: 'root' })
export class BookLibraryService {
  private readonly document = inject(DOCUMENT);
  private readonly stateSubject = new BehaviorSubject<BookLibrary>(emptyLibrary());
  private readonly warningState = signal<string | null>(null);
  private readonly storageKey = 'bookmonkey-library-v1';
  private initialized = false;

  readonly state$ = this.stateSubject.asObservable();
  readonly storageWarning = this.warningState.asReadonly();

  get snapshot(): BookLibrary {
    return this.stateSubject.value;
  }

  initialize(): void {
    if (this.initialized) return;
    this.initialized = true;
    try {
      const stored = this.document.defaultView?.localStorage.getItem(this.storageKey);
      if (stored) this.stateSubject.next(parseLibrary(JSON.parse(stored)));
    } catch {
      this.warningState.set('Your saved library could not be loaded. Changes may only be available during this visit.');
    }
  }

  toggleSaved(id: string): void {
    const state = this.snapshot;
    this.update({
      ...state,
      savedIds: state.savedIds.includes(id) ? state.savedIds.filter(value => value !== id) : [...state.savedIds, id]
    });
  }

  setReadingStatus(id: string, status: ReadingStatus | ''): void {
    if (status) {
      if (this.snapshot.readingStatuses[id] !== status) this.moveReadingBook(id, status);
      return;
    }
    const statuses = { ...this.snapshot.readingStatuses };
    delete statuses[id];
    const readingOrder = this.orderWithout(id);
    this.update({ ...this.snapshot, readingStatuses: statuses, readingOrder });
  }

  moveReadingBook(id: string, status: ReadingStatus, beforeId?: string): void {
    const readingOrder = this.orderWithout(id);
    const index = beforeId ? readingOrder[status].indexOf(beforeId) : -1;
    readingOrder[status].splice(index < 0 ? readingOrder[status].length : index, 0, id);
    this.update({
      ...this.snapshot,
      readingStatuses: { ...this.snapshot.readingStatuses, [id]: status },
      readingOrder
    });
  }

  private orderWithout(id: string): Record<ReadingStatus, string[]> {
    const order = emptyReadingOrder();
    for (const status of readingStatuses)
      order[status] = this.snapshot.readingOrder[status].filter(value => value !== id);
    return order;
  }

  createBook(edits: BookEdits): string {
    if (!isBookEdits(edits)) throw new Error('Invalid book changes');
    const id = `local-${globalThis.crypto.randomUUID()}`;
    const book: Book = { ...edits, id, userId: 0 };
    this.update({ ...this.snapshot, createdBooks: [book, ...this.snapshot.createdBooks] });
    return id;
  }

  getCreatedBook(id: string): Book | undefined {
    return this.snapshot.createdBooks.find(book => book.id === id);
  }

  recordViewed(id: string): void {
    if (this.snapshot.recentIds[0] === id) return;
    this.update({ ...this.snapshot, recentIds: [id, ...this.snapshot.recentIds.filter(value => value !== id)] });
  }

  saveEdits(id: string, edits: BookEdits): void {
    if (!isBookEdits(edits)) throw new Error('Invalid book changes');
    this.update({ ...this.snapshot, edits: { ...this.snapshot.edits, [id]: { ...edits } } });
  }

  private update(state: BookLibrary): void {
    this.stateSubject.next(state);
    try {
      const storage = this.document.defaultView?.localStorage;
      if (!storage) throw new Error('Storage unavailable');
      storage.setItem(this.storageKey, JSON.stringify(state));
      this.warningState.set(null);
    } catch {
      this.warningState.set('These changes are available for this visit only. Browser storage is unavailable.');
    }
  }
}
