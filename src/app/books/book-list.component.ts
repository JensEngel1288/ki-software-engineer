import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, OnChanges, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BehaviorSubject, catchError, combineLatest, map, of, startWith, Subject, switchMap, timer } from 'rxjs';
import { LoadingIndicatorComponent } from '../shared/loading-indicator.component';
import { StateMessageComponent } from '../shared/state-message.component';
import { Book } from './book';
import { BookApiClient } from './book-api-client.service';
import {
  CollectionPage,
  CollectionQuery,
  CollectionView,
  BookFilters,
  defaultFilters,
  selectBooks
} from './book-collection';
import { BookFiltersComponent } from './book-filters.component';
import { BookItemComponent } from './book-item.component';
import { BookLibraryService } from './book-library.service';
import { BookUniverseComponent } from './book-universe.component';
import { BookPaginationComponent } from './book-pagination.component';
import { BookReadingBoardComponent } from './book-reading-board.component';
import { RequestState } from './request-state';

@Component({
  selector: 'app-book-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    RouterLink,
    BookItemComponent,
    BookFiltersComponent,
    BookUniverseComponent,
    BookPaginationComponent,
    BookReadingBoardComponent,
    LoadingIndicatorComponent,
    StateMessageComponent
  ],
  templateUrl: './book-list.component.html'
})
export class BookListComponent implements OnChanges {
  readonly pageSize = input(10, { transform: (value: number) => Math.max(1, Math.floor(value || 10)) });
  private readonly api = inject(BookApiClient);
  protected readonly library = inject(BookLibraryService);
  private readonly reloadRequests = new Subject<void>();
  private readonly events = new BehaviorSubject<{ query: CollectionQuery; delayMs: number }>({
    query: { ...defaultFilters, search: '', view: 'all', limit: 10, page: 1 },
    delayMs: 0
  });

  protected readonly searchTerm = signal('');
  protected readonly displayMode = signal<'gallery' | 'universe' | 'reading'>('gallery');
  private readonly displays = ['gallery', 'universe', 'reading'] as const;

  ngOnChanges(): void {
    this.updateQuery({ limit: this.pageSize(), page: 1 });
  }

  protected onDisplayKeydown(event: KeyboardEvent): void {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const current = this.displays.indexOf(this.displayMode());
    const index =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? this.displays.length - 1
          : (current + (event.key === 'ArrowRight' ? 1 : -1) + this.displays.length) % this.displays.length;
    this.displayMode.set(this.displays[index]);
    (event.currentTarget as HTMLButtonElement).parentElement
      ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
      .item(index)
      ?.focus();
  }
  protected get query(): CollectionQuery {
    return this.events.value.query;
  }
  protected get emptyTitle(): string {
    if (this.query.search) return 'No books match your search';
    if (this.query.view === 'saved') return 'No saved books yet';
    if (this.query.view === 'recent') return 'No recently viewed books yet';
    return 'No books match your filters';
  }

  private readonly catalogue$ = this.reloadRequests.pipe(
    startWith(undefined),
    switchMap(() =>
      this.api.getBooks().pipe(
        map((books): RequestState<Book[]> => ({ status: 'ready', data: books })),
        catchError(() =>
          of<RequestState<Book[]>>({ status: 'error', message: 'Please check your connection and try again.' })
        ),
        startWith<RequestState<Book[]>>({ status: 'loading' })
      )
    )
  );

  protected readonly state$ = combineLatest([
    this.catalogue$,
    this.library.state$,
    this.events.pipe(switchMap(event => (event.delayMs ? timer(event.delayMs) : of(0)).pipe(map(() => event.query))))
  ]).pipe(
    map(
      ([catalogue, library, query]): RequestState<CollectionPage> =>
        catalogue.status === 'ready'
          ? { status: 'ready', data: selectBooks(catalogue.data, library, query) }
          : catalogue
    )
  );

  protected onSearchChange(value: string): void {
    this.searchTerm.set(value);
    const search = value.trim();
    if (search !== this.query.search) this.updateQuery({ search, limit: this.pageSize(), page: 1 }, search ? 300 : 0);
  }
  protected clearSearch(): void {
    this.onSearchChange('');
  }
  protected setView(view: CollectionView): void {
    this.updateQuery({ view, limit: this.pageSize(), page: 1 });
  }
  protected onFiltersChange(filters: BookFilters): void {
    this.updateQuery({ ...filters, limit: this.pageSize(), page: 1 });
  }
  protected goToPage(page: number): void {
    this.updateQuery({ page });
  }
  protected retry(): void {
    this.reloadRequests.next();
  }

  private updateQuery(changes: Partial<CollectionQuery>, delayMs = 0): void {
    this.events.next({ query: { ...this.query, ...changes }, delayMs });
  }
}
