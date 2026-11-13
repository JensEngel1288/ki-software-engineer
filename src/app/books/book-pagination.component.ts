import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'app-book-pagination',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav aria-label="Book pagination" class="mt-8 flex flex-wrap items-center justify-center gap-4">
      <button
        type="button"
        class="button-secondary"
        aria-label="Previous page"
        [disabled]="page() <= 1"
        (click)="pageChange.emit(page() - 1)"
      >
        Previous
      </button>
      <span role="status" class="text-sm text-secondary">Page {{ page() }} of {{ pageCount() }}</span>
      <label class="flex items-center gap-2 text-sm">
        Go to page
        <select #selector class="form-control w-auto" [value]="page()" (change)="selectPage(selector.value)">
          @for (number of pages(); track number) {
            <option [value]="number">{{ number }}</option>
          }
        </select>
      </label>
      <button
        type="button"
        class="button-secondary"
        aria-label="Next page"
        [disabled]="page() >= pageCount()"
        (click)="pageChange.emit(page() + 1)"
      >
        Next
      </button>
    </nav>
  `
})
export class BookPaginationComponent {
  readonly page = input.required<number>();
  readonly pageCount = input.required<number>();
  readonly pageChange = output<number>();
  protected readonly pages = computed(() => Array.from({ length: this.pageCount() }, (_, index) => index + 1));

  protected selectPage(value: string): void {
    const page = Number(value);
    if (Number.isInteger(page) && page >= 1 && page <= this.pageCount()) this.pageChange.emit(page);
  }
}
