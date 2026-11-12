import { ChangeDetectionStrategy, Component, input, OnChanges, output } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Book } from './book';
import { BookEdits } from './book-library';

function positivePageCount(control: AbstractControl<number | null>): ValidationErrors | null {
  const value = control.value;
  return value !== null && Number.isInteger(value) && value > 0 ? null : { positivePageCount: true };
}

@Component({
  selector: 'app-book-edit-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './book-edit-form.component.html'
})
export class BookEditFormComponent implements OnChanges {
  readonly book = input.required<Book>();
  readonly save = output<BookEdits>();
  protected readonly form = new FormGroup({
    title: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/\S/)] }),
    subtitle: new FormControl('', { nonNullable: true }),
    author: new FormControl('', { nonNullable: true }),
    publisher: new FormControl('', { nonNullable: true }),
    isbn: new FormControl('', { nonNullable: true }),
    numPages: new FormControl<number | null>(null, [Validators.required, positivePageCount]),
    price: new FormControl('', { nonNullable: true }),
    cover: new FormControl('', { nonNullable: true }),
    abstract: new FormControl('', { nonNullable: true })
  });

  ngOnChanges(): void {
    const { title, subtitle = '', author, publisher, isbn, numPages, price, cover, abstract } = this.book();
    this.form.reset({ title, subtitle, author, publisher, isbn, numPages, price, cover, abstract });
  }

  protected submit(): void {
    const { numPages, ...values } = this.form.getRawValue();
    if (this.form.invalid || numPages === null) return;
    this.save.emit({
      numPages,
      title: values.title.trim(),
      subtitle: values.subtitle.trim(),
      author: values.author.trim(),
      publisher: values.publisher.trim(),
      isbn: values.isbn.trim(),
      price: values.price.trim(),
      cover: values.cover.trim(),
      abstract: values.abstract.trim()
    });
  }
}
