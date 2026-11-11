import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BookLibraryService } from './books/book-library.service';
import { ErrorReporter } from './shared/error-reporter.service';
import { StateMessageComponent } from './shared/state-message.component';
import { ThemeService } from './shared/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, StateMessageComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly library = inject(BookLibraryService);
  protected readonly theme = inject(ThemeService);
  protected readonly errors = inject(ErrorReporter);
}
