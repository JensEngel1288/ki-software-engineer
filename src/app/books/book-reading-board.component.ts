import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList, CdkDropListGroup } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, computed, input, linkedSignal, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Book } from './book';
import { BookLibrary, ReadingStatus, readingStatuses } from './book-library';

interface ReadingColumn {
  status: ReadingStatus;
  label: string;
  books: Book[];
}

const labels: Record<ReadingStatus, string> = {
  'want-to-read': 'Want to read',
  reading: 'Currently reading',
  finished: 'Read'
};

@Component({
  selector: 'app-book-reading-board',
  imports: [RouterLink, CdkDrag, CdkDragHandle, CdkDropList, CdkDropListGroup],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './book-reading-board.component.html',
  styles: `
    .cdk-drag-preview {
      box-sizing: border-box;
      box-shadow: 0 12px 24px #0003;
    }
    .cdk-drag-placeholder {
      opacity: 0.2;
    }
    .cdk-drag-animating {
      transition: transform 180ms ease;
    }
    @media (prefers-reduced-motion: reduce) {
      .cdk-drag-animating {
        transition: none;
      }
    }
  `
})
export class BookReadingBoardComponent {
  readonly books = input.required<Book[]>();
  readonly library = input.required<BookLibrary>();
  readonly statusChange = output<{ id: string; status: ReadingStatus | '' }>();
  readonly move = output<{ id: string; status: ReadingStatus; beforeId?: string }>();
  protected readonly columns = computed<ReadingColumn[]>(() => {
    const books = new Map(this.books().map(book => [book.id, book]));
    return readingStatuses.map(status => ({
      status,
      label: labels[status],
      books: this.library()
        .readingOrder[status].map(id => books.get(id))
        .filter((book): book is Book => book !== undefined)
    }));
  });
  protected readonly availableBooks = computed(() =>
    this.books().filter(book => !this.library().readingStatuses[book.id])
  );
  protected readonly selectedId = linkedSignal<Book[], string>({
    source: this.availableBooks,
    computation: (books, previous) => {
      const selectedId = previous?.value ?? '';
      return books.some(book => book.id === selectedId) ? selectedId : '';
    }
  });
  protected readonly announcement = signal('');
  protected readonly cardCount = computed(() =>
    this.columns().reduce((total, column) => total + column.books.length, 0)
  );

  protected addBook(): void {
    const book = this.availableBooks().find(book => book.id === this.selectedId());
    if (!book) return;
    this.statusChange.emit({ id: book.id, status: 'want-to-read' });
    this.selectedId.set('');
    this.announcement.set(`Added ${book.title} to Want to read.`);
  }

  protected changeStatus(book: Book, value: string): void {
    const status = readingStatuses.find(status => status === value);
    if (!status) return;
    this.statusChange.emit({ id: book.id, status });
    this.announcement.set(`Moved ${book.title} to ${labels[status]}.`);
  }

  protected removeBook(book: Book): void {
    this.statusChange.emit({ id: book.id, status: '' });
    this.announcement.set(`Removed ${book.title} from the reading list.`);
  }

  protected drop(event: CdkDragDrop<ReadingColumn, ReadingColumn, Book>): void {
    const book = event.item.data;
    const target = event.container.data;
    const remaining = target.books.filter(candidate => candidate.id !== book.id);
    this.move.emit({ id: book.id, status: target.status, beforeId: remaining[event.currentIndex]?.id });
    this.announcement.set(`Moved ${book.title} to ${target.label}.`);
  }
}
