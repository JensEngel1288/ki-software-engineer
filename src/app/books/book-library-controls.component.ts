import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ReadingStatus } from './book-library';

@Component({
  selector: 'app-book-library-controls',
  imports: [FormsModule],
  template: `
    <div class="flex flex-wrap items-end gap-3">
      <button type="button" class="button-secondary" [attr.aria-pressed]="saved" (click)="savedToggle.emit()">
        {{ saved ? 'Remove from read later' : 'Save for later' }}
      </button>
      <label class="grid min-w-0 gap-1 text-sm font-medium">
        <span>Reading status</span>
        <select
          [attr.aria-label]="'Reading status for ' + title"
          [ngModel]="status"
          (ngModelChange)="statusChange.emit($event)"
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
  @Input() saved = false;
  @Input() status: ReadingStatus | '' = '';
  @Input() title = '';
  @Output() savedToggle = new EventEmitter<void>();
  @Output() statusChange = new EventEmitter<ReadingStatus | ''>();
}
