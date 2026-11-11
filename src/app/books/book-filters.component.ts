import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BookFilters, defaultFilters } from './book-collection';

@Component({
  selector: 'app-book-filters',
  imports: [FormsModule],
  templateUrl: './book-filters.component.html'
})
export class BookFiltersComponent {
  @Input({ required: true }) filters!: BookFilters;
  @Output() filtersChange = new EventEmitter<BookFilters>();

  protected update(changes: Partial<BookFilters>): void {
    this.filtersChange.emit({ ...this.filters, ...changes });
  }
  protected clear(): void {
    this.filtersChange.emit({ ...defaultFilters });
  }
  protected get invalidRange(): boolean {
    return (
      this.filters.minPages !== null && this.filters.maxPages !== null && this.filters.minPages > this.filters.maxPages
    );
  }
}
