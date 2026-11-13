import { ChangeDetectionStrategy, Component, computed, input, OnChanges, output, signal } from '@angular/core';
import { form, FormField, min, validate } from '@angular/forms/signals';
import { BookFilters, defaultFilters } from './book-collection';

@Component({
  selector: 'app-book-filters',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField],
  templateUrl: './book-filters.component.html'
})
export class BookFiltersComponent implements OnChanges {
  readonly filters = input.required<BookFilters>();
  readonly allowSorting = input(true);
  readonly filtersChange = output<BookFilters>();
  private readonly model = signal<BookFilters>({ ...defaultFilters });
  protected readonly form = form(this.model, schema => {
    min(schema.minPages, 0);
    min(schema.maxPages, 0);
    validate(schema, ({ value }) => {
      const { minPages, maxPages } = value();
      return minPages !== null && maxPages !== null && minPages > maxPages ? { kind: 'pageRange' } : null;
    });
  });
  protected readonly invalidRange = computed(() =>
    this.form()
      .errors()
      .some(error => error.kind === 'pageRange')
  );

  ngOnChanges(): void {
    const { author, publisher, minPages, maxPages, sort, readingStatus } = this.filters();
    this.form().reset({ author, publisher, minPages, maxPages, sort, readingStatus });
  }

  protected emitFilters(): void {
    this.filtersChange.emit({ ...this.model() });
  }

  protected clear(): void {
    this.form().reset({ ...defaultFilters });
    this.emitFilters();
  }
}
