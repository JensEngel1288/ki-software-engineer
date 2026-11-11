import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { EXPECTED_NOT_FOUND } from '../shared/http-error.interceptor';
import { Book } from './book';
import { BOOK_API_URL } from './book-api.config';

@Injectable({ providedIn: 'root' })
export class BookApiClient {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(BOOK_API_URL).replace(/\/+$/, '');

  getBook(id: string): Observable<Book> {
    return this.http.get<Book>(`${this.apiUrl}/${encodeURIComponent(id)}`, {
      context: new HttpContext().set(EXPECTED_NOT_FOUND, true)
    });
  }

  getBooks(): Observable<Book[]> {
    return this.http.get<Book[]>(this.apiUrl);
  }
}
