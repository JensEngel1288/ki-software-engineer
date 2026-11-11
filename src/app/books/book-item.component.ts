import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Book } from './book';
import { BookCoverComponent } from './book-cover.component';
import { ReadingStatus } from './book-library';
import { BookLibraryControlsComponent } from './book-library-controls.component';

@Component({
  selector: 'app-book-item',
  standalone: true,
  imports: [RouterLink, BookCoverComponent, BookLibraryControlsComponent],
  template: `
    <div class="flex h-full flex-col overflow-hidden rounded-lg bg-surface shadow-md ring-1 ring-divider">
      <app-book-cover [src]="book.cover" [alt]="book.title"></app-book-cover>
      <div class="flex flex-grow flex-col gap-3 p-5">
        <div>
          <h2 class="mb-1 line-clamp-2 text-lg font-semibold">
            <a [routerLink]="['/books', book.id]" class="text-link">{{ book.title }}</a>
          </h2>
          @if (book.subtitle) {
            <p class="line-clamp-2 text-sm text-secondary">{{ book.subtitle }}</p>
          }
          <p class="mt-2 text-sm text-accent">{{ book.author }}</p>
          @if (book.isbn) {
            <p class="mt-2 text-xs text-muted">ISBN: {{ book.isbn }}</p>
          }
        </div>
        <div class="mt-auto border-t border-divider pt-3">
          <app-book-library-controls
            [title]="book.title"
            [saved]="saved"
            [status]="readingStatus"
            (savedToggle)="savedToggle.emit()"
            (statusChange)="readingStatusChange.emit($event)"
          ></app-book-library-controls>
          <a
            [routerLink]="['/books', book.id, 'edit']"
            [attr.aria-label]="'Edit ' + book.title"
            class="text-link mt-3 inline-block text-sm"
            >Edit book</a
          >
        </div>
      </div>
    </div>
  `
})
export class BookItemComponent {
  @Input({ required: true }) book!: Book;
  @Input() saved = false;
  @Input() readingStatus: ReadingStatus | '' = '';
  @Output() savedToggle = new EventEmitter<void>();
  @Output() readingStatusChange = new EventEmitter<ReadingStatus | ''>();
}
