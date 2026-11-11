import { AsyncPipe } from '@angular/common';
import { Component, inject, Input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
import { RequestState } from './request-state';

@Component({
  selector: 'app-book-list',
  standalone: true,
  imports: [
    AsyncPipe,
    FormsModule,
    BookItemComponent,
    BookFiltersComponent,
    BookUniverseComponent,
    LoadingIndicatorComponent,
    StateMessageComponent
  ],
  templateUrl: './book-list.component.html'
})
export class BookListComponent {
  private readonly api = inject(BookApiClient);
  protected readonly library = inject(BookLibraryService);
  private readonly reloadRequests = new Subject<void>();
  private pageSizeValue = 10;
  private readonly events = new BehaviorSubject<{ query: CollectionQuery; delayMs: number }>({
    query: { ...defaultFilters, search: '', view: 'all', limit: 10 },
    delayMs: 0
  });

  @Input() set pageSize(value: number) {
    this.pageSizeValue = Math.max(1, Math.floor(value || 10));
    this.updateQuery({ limit: this.pageSizeValue });
  }
  get pageSize(): number {
    return this.pageSizeValue;
  }

  protected searchTerm = '';
  protected readonly displayMode = signal<'gallery' | 'universe'>('gallery');

  protected onDisplayKeydown(event: KeyboardEvent): void {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const index = event.key === 'Home' ? 0 : event.key === 'End' ? 1 : this.displayMode() === 'gallery' ? 1 : 0;
    this.displayMode.set(index === 0 ? 'gallery' : 'universe');
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
    this.searchTerm = value;
    const search = value.trim();
    if (search !== this.query.search) this.updateQuery({ search, limit: this.pageSize }, search ? 300 : 0);
  }
  protected clearSearch(): void {
    this.onSearchChange('');
  }
  protected setView(view: CollectionView): void {
    this.updateQuery({ view, limit: this.pageSize });
  }
  protected onFiltersChange(filters: BookFilters): void {
    this.updateQuery({ ...filters, limit: this.pageSize });
  }
  protected showMore(): void {
    this.updateQuery({ limit: this.query.limit + this.pageSize });
  }
  protected retry(): void {
    this.reloadRequests.next();
  }

  private updateQuery(changes: Partial<CollectionQuery>, delayMs = 0): void {
    this.events.next({ query: { ...this.query, ...changes }, delayMs });
  }
}
