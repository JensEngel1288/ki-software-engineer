import { AsyncPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  catchError,
  combineLatest,
  distinctUntilChanged,
  map,
  Observable,
  of,
  startWith,
  Subject,
  switchMap,
  tap
} from 'rxjs';
import { LoadingIndicatorComponent } from '../shared/loading-indicator.component';
import { StateMessageComponent } from '../shared/state-message.component';
import { Book } from './book';
import { BookApiClient } from './book-api-client.service';
import { BookCoverComponent } from './book-cover.component';
import { RequestState } from './request-state';
import { applyBookEdits } from './book-library';
import { BookLibraryService } from './book-library.service';
import { BookLibraryControlsComponent } from './book-library-controls.component';

type BookDetailsState = RequestState<Book> | { status: 'not-found' };

@Component({
  selector: 'app-book-details',
  standalone: true,
  imports: [
    AsyncPipe,
    RouterLink,
    BookCoverComponent,
    BookLibraryControlsComponent,
    LoadingIndicatorComponent,
    StateMessageComponent
  ],
  templateUrl: './book-details.component.html'
})
export class BookDetailsComponent {
  protected readonly library = inject(BookLibraryService);
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(BookApiClient);
  private readonly retryRequests = new Subject<void>();

  private readonly bookState$ = combineLatest([
    this.route.paramMap.pipe(
      map(params => params.get('id')),
      distinctUntilChanged()
    ),
    this.retryRequests.pipe(startWith(undefined))
  ]).pipe(switchMap(([id]) => this.loadBook(id)));

  protected readonly state$ = combineLatest([this.bookState$, this.library.state$]).pipe(
    map(
      ([state, library]): BookDetailsState =>
        state.status === 'ready' ? { status: 'ready', data: applyBookEdits(state.data, library) } : state
    )
  );

  protected retry(): void {
    this.retryRequests.next();
  }

  private loadBook(id: string | null): Observable<BookDetailsState> {
    if (!id) {
      return of({ status: 'not-found' });
    }
    return this.api.getBook(id).pipe(
      tap(book => {
        if (book) this.library.recordViewed(book.id);
      }),
      map((book): BookDetailsState => (book ? { status: 'ready', data: book } : { status: 'not-found' })),
      catchError((error: HttpErrorResponse) =>
        of<BookDetailsState>(
          error.status === 404
            ? { status: 'not-found' }
            : { status: 'error', message: 'Please check your connection and try again.' }
        )
      ),
      startWith<BookDetailsState>({ status: 'loading' })
    );
  }
}
