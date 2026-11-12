import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ReadingStatus, readingStatuses } from './book-library';

@Component({
  selector: 'app-book-library-controls',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-wrap items-end gap-3">
      <button type="button" class="button-secondary" [attr.aria-pressed]="saved()" (click)="savedToggle.emit()">
        {{ saved() ? 'Remove from read later' : 'Save for later' }}
      </button>
      <label class="grid min-w-0 gap-1 text-sm font-medium">
        <span>Reading status</span>
        <select
          #statusSelect
          [attr.aria-label]="'Reading status for ' + title()"
          [value]="status()"
          (change)="changeStatus(statusSelect.value)"
          class="form-control"
        >
          <option value="">Not set</option>
          <option value="want-to-read">Want to read</option>
          <option value="reading">Reading</option>
          <option value="finished">Finished</option>
        </select>
      </label>
    </div>
  `
})
export class BookLibraryControlsComponent {
  readonly saved = input(false);
  readonly status = input<ReadingStatus | ''>('');
  readonly title = input('');
  readonly savedToggle = output<void>();
  readonly statusChange = output<ReadingStatus | ''>();

  protected changeStatus(value: string): void {
    const status = readingStatuses.find(status => status === value);
    if (value === '' || status) this.statusChange.emit(status ?? '');
  }
}
