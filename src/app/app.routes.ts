import { Routes } from '@angular/router';
import { BookDetailsComponent } from './books/book-details.component';
import { BookEditComponent } from './books/book-edit.component';
import { BookListComponent } from './books/book-list.component';

export const routes: Routes = [
  { path: '', component: BookListComponent },
  { path: 'books/:id/edit', component: BookEditComponent },
  { path: 'books/:id', component: BookDetailsComponent },
  { path: '**', redirectTo: '' }
];
