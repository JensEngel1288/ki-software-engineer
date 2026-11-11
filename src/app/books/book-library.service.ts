import { DOCUMENT } from '@angular/common';
import { inject, Injectable, signal } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { BookEdits, BookLibrary, emptyLibrary, isBookEdits, parseLibrary, ReadingStatus } from './book-library';

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
    const statuses = { ...this.snapshot.readingStatuses };
    if (status) statuses[id] = status;
    else delete statuses[id];
    this.update({ ...this.snapshot, readingStatuses: statuses });
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
