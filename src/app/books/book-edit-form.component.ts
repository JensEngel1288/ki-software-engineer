import { ChangeDetectionStrategy, Component, input, OnChanges, output, signal, SimpleChanges } from '@angular/core';
import { form, FormField, FormRoot, min, pattern, required, validate } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { Book } from './book';
import { BookEdits } from './book-library';

type BookDraft = Omit<BookEdits, 'subtitle' | 'numPages'> & { subtitle: string; numPages: number | null };

@Component({
  selector: 'app-book-edit-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, FormRoot, RouterLink],
  templateUrl: './book-edit-form.component.html'
})
export class BookEditFormComponent implements OnChanges {
  readonly book = input.required<Book>();
  readonly save = output<BookEdits>();
  readonly submitLabel = input('Save changes');
  readonly cancelLink = input<string[] | null>(null);
  private readonly draft = signal<BookDraft>({
    title: '',
    subtitle: '',
    author: '',
    publisher: '',
    isbn: '',
    numPages: null,
    price: '',
    cover: '',
    abstract: ''
  });
  protected readonly form = form(
    this.draft,
    schema => {
      required(schema.title);
      pattern(schema.title, /\S/);
      required(schema.numPages);
      min(schema.numPages, 1);
      validate(schema.numPages, ({ value }) =>
        value() !== null && !Number.isInteger(value()) ? { kind: 'wholePageCount' } : null
      );
    },
    { submission: { action: async () => this.submit() } }
  );

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['book']) return;
    const { title, subtitle = '', author, publisher, isbn, numPages, price, cover, abstract } = this.book();
    this.form().reset({ title, subtitle, author, publisher, isbn, numPages, price, cover, abstract });
  }

  protected submit(): void {
    const { numPages, ...values } = this.draft();
    if (this.form().invalid() || numPages === null) return;
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
