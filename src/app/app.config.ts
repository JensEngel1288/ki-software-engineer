import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  ErrorHandler,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { BOOK_API_URL } from './books/book-api.config';
import { BookLibraryService } from './books/book-library.service';
import { GlobalErrorHandler } from './shared/global-error-handler';
import { httpErrorInterceptor } from './shared/http-error.interceptor';
import { ThemeService } from './shared/theme.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    { provide: BOOK_API_URL, useValue: 'http://localhost:4730/books' },
    provideAppInitializer(() => inject(ThemeService).initialize()),
    provideAppInitializer(() => inject(BookLibraryService).initialize()),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([httpErrorInterceptor]))
  ]
};
