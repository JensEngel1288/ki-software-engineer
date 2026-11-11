import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Book } from './book';
import { BookEdits } from './book-library';

@Component({
  selector: 'app-book-edit-form',
  imports: [FormsModule, RouterLink],
  templateUrl: './book-edit-form.component.html'
})
export class BookEditFormComponent {
  @Input({ required: true }) set book(value: Book) {
    this.id = value.id;
    this.model = {
      title: value.title,
      subtitle: value.subtitle ?? '',
      author: value.author,
      publisher: value.publisher,
      isbn: value.isbn,
      numPages: value.numPages,
      price: value.price,
      cover: value.cover,
      abstract: value.abstract
    };
  }
  @Output() save = new EventEmitter<BookEdits>();
  protected id = '';
  protected model!: BookEdits;
  protected get validPages(): boolean {
    return Number.isInteger(this.model.numPages) && this.model.numPages > 0;
  }
  protected submit(): void {
    if (!this.model.title.trim() || !this.validPages) return;
    this.save.emit({
      ...this.model,
      title: this.model.title.trim(),
      subtitle: this.model.subtitle?.trim(),
      author: this.model.author.trim(),
      publisher: this.model.publisher.trim(),
      isbn: this.model.isbn.trim(),
      price: this.model.price.trim(),
      cover: this.model.cover.trim(),
      abstract: this.model.abstract.trim()
    });
  }
}
