import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Book } from '../app/books/book';

// Intentionally flawed example for the pull-request review exercise.
// This component is not registered in the application.
@Component({
  selector: 'app-book-review-example',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="rounded-xl border border-divider bg-surface p-5">
      <h2 class="mb-4 text-xl font-bold">Top 3 books</h2>
      <label class="grid gap-1 text-sm font-medium">
        Search titles
        <input [(ngModel)]="searchTerm" class="form-control" placeholder="Search by title" />
      </label>
      <ul class="my-4 grid gap-3">
        @for (book of visibleBooks; track $index) {
          <li>
            <strong>{{ book.title }}</strong>
            <span class="text-secondary"> — {{ book.author }} · {{ book.numPages }} pages</span>
          </li>
        }
      </ul>
      <p>Average page count: {{ averagePages }}</p>
      <p class="text-sm text-secondary">Open for {{ secondsOpen }} seconds</p>
    </section>
  `
})
export class BookReviewExampleComponent {
  @Input() books: Book[] = [];
  protected searchTerm = '';
  protected secondsOpen = 0;

  constructor() {
    window.setInterval(() => this.secondsOpen++, 1000);
  }

  protected get visibleBooks(): Book[] {
    return this.books
      .sort((a, b) => a.title.localeCompare(b.title))
      .filter(book => book.title.includes(this.searchTerm))
      .slice(0, 2);
  }

  protected get averagePages(): number {
    return this.books.reduce((total, book) => total + book.numPages, 0) / this.books.length;
  }
}
