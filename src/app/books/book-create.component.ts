import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Book } from './book';
import { BookEditFormComponent } from './book-edit-form.component';
import { BookEdits } from './book-library';
import { BookLibraryService } from './book-library.service';

@Component({
  selector: 'app-book-create',
  imports: [RouterLink, BookEditFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container mx-auto max-w-3xl px-4 py-12">
      <a routerLink="/" class="text-link mb-8 inline-block">← Back to books</a>
      <h1 class="mb-3 text-3xl font-bold text-accent">Add book</h1>
      <p class="mb-8 text-secondary">Your new book is saved in this browser.</p>
      <app-book-edit-form
        [book]="draft"
        submitLabel="Create book"
        [cancelLink]="['/']"
        (save)="create($event)"
      ></app-book-edit-form>
    </div>
  `
})
export class BookCreateComponent {
  private readonly library = inject(BookLibraryService);
  private readonly router = inject(Router);
  protected readonly draft: Book = {
    id: '',
    title: '',
    subtitle: '',
    author: '',
    publisher: '',
    isbn: '',
    numPages: 0,
    price: '',
    cover: '',
    abstract: '',
    userId: 0
  };

  protected create(edits: BookEdits): void {
    const id = this.library.createBook(edits);
    void this.router.navigate(['/books', id]);
  }
}
