import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  OnChanges,
  OnInit,
  output
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { BookFilters, BookSort, defaultFilters } from './book-collection';
import { ReadingStatus } from './book-library';

@Component({
  selector: 'app-book-filters',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './book-filters.component.html'
})
export class BookFiltersComponent implements OnChanges, OnInit {
  readonly filters = input.required<BookFilters>();
  readonly filtersChange = output<BookFilters>();
  private readonly destroyRef = inject(DestroyRef);
  protected readonly form = new FormGroup({
    author: new FormControl('', { nonNullable: true }),
    publisher: new FormControl('', { nonNullable: true }),
    minPages: new FormControl<number | null>(null),
    maxPages: new FormControl<number | null>(null),
    sort: new FormControl<BookSort>('default', { nonNullable: true }),
    readingStatus: new FormControl<ReadingStatus | ''>('', { nonNullable: true })
  });
  protected readonly invalidRange = computed(() => {
    const { minPages, maxPages } = this.filters();
    return minPages !== null && maxPages !== null && minPages > maxPages;
  });

  ngOnChanges(): void {
    const { author, publisher, minPages, maxPages, sort, readingStatus } = this.filters();
    this.form.setValue({ author, publisher, minPages, maxPages, sort, readingStatus }, { emitEvent: false });
  }

  ngOnInit(): void {
    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.filtersChange.emit(this.form.getRawValue());
    });
  }

  protected clear(): void {
    this.form.reset(defaultFilters);
  }
}
