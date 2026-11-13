import { AsyncPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  catchError,
  combineLatest,
  distinctUntilChanged,
  map,
  Observable,
  of,
  startWith,
  Subject,
  switchMap
} from 'rxjs';
import { LoadingIndicatorComponent } from '../shared/loading-indicator.component';
import { StateMessageComponent } from '../shared/state-message.component';
import { Book } from './book';
import { BookApiClient } from './book-api-client.service';
import { BookEditFormComponent } from './book-edit-form.component';
import { applyBookEdits, BookEdits } from './book-library';
import { BookLibraryService } from './book-library.service';
import { RequestState } from './request-state';

type EditState = RequestState<Book> | { status: 'not-found' };

@Component({
  selector: 'app-book-edit',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AsyncPipe, RouterLink, BookEditFormComponent, LoadingIndicatorComponent, StateMessageComponent],
  templateUrl: './book-edit.component.html'
})
export class BookEditComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(BookApiClient);
  private readonly library = inject(BookLibraryService);
  private readonly reload = new Subject<void>();
  protected readonly state$ = combineLatest([
    this.route.paramMap.pipe(
      map(params => params.get('id')),
      distinctUntilChanged()
    ),
    this.reload.pipe(startWith(undefined))
  ]).pipe(switchMap(([id]) => this.loadBook(id)));

  protected retry(): void {
    this.reload.next();
  }
  protected save(id: string, edits: BookEdits): void {
    this.library.saveEdits(id, edits);
    void this.router.navigate(['/books', id]);
  }
  private loadBook(id: string | null): Observable<EditState> {
    if (!id) return of({ status: 'not-found' });
    const local = this.library.getCreatedBook(id);
    return (local ? of(local) : this.api.getBook(id)).pipe(
      map(
        (book): EditState =>
          book ? { status: 'ready', data: applyBookEdits(book, this.library.snapshot) } : { status: 'not-found' }
      ),
      catchError((error: HttpErrorResponse) =>
        of<EditState>(
          error.status === 404
            ? { status: 'not-found' }
            : { status: 'error', message: 'Please check your connection and try again.' }
        )
      ),
      startWith<EditState>({ status: 'loading' })
    );
  }
}
