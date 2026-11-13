import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, combineLatest, map, of, startWith, Subject, switchMap } from 'rxjs';
import { LoadingIndicatorComponent } from '../shared/loading-indicator.component';
import { StateMessageComponent } from '../shared/state-message.component';
import { Book } from './book';
import { BookApiClient } from './book-api-client.service';
import { BookCoverComponent } from './book-cover.component';
import { BookLibraryControlsComponent } from './book-library-controls.component';
import { BookLibraryService } from './book-library.service';
import { recommendBook } from './book-recommendation';
import { RequestState } from './request-state';

@Component({
  selector: 'app-book-recommendation',
  imports: [
    AsyncPipe,
    RouterLink,
    BookCoverComponent,
    BookLibraryControlsComponent,
    LoadingIndicatorComponent,
    StateMessageComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './book-recommendation.component.html'
})
export class BookRecommendationComponent {
  private readonly api = inject(BookApiClient);
  protected readonly library = inject(BookLibraryService);
  private readonly month = new Date();
  protected readonly monthLabel = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(this.month);
  protected readonly monthIso = `${this.month.getFullYear()}-${String(this.month.getMonth() + 1).padStart(2, '0')}`;
  private readonly reloadRequests = new Subject<void>();
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
  protected readonly state$ = combineLatest([this.catalogue$, this.library.state$]).pipe(
    map(
      ([catalogue, library]): RequestState<Book | null> =>
        catalogue.status === 'ready'
          ? { status: 'ready', data: recommendBook(catalogue.data, library, this.month) }
          : catalogue
    )
  );

  protected retry(): void {
    this.reloadRequests.next();
  }
}
