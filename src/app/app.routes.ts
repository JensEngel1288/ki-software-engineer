import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./books/book-list.component').then(m => m.BookListComponent) },
  { path: 'books/:id/edit', loadComponent: () => import('./books/book-edit.component').then(m => m.BookEditComponent) },
  {
    path: 'books/:id',
    loadComponent: () => import('./books/book-details.component').then(m => m.BookDetailsComponent)
  },
  { path: '**', redirectTo: '' }
];
