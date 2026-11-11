import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ErrorReporter } from './error-reporter.service';

export const EXPECTED_NOT_FOUND = new HttpContextToken<boolean>(() => false);

export const httpErrorInterceptor: HttpInterceptorFn = (request, next) => {
  const reporter = inject(ErrorReporter);
  return next(request).pipe(
    catchError((error: unknown) => {
      const status = error instanceof HttpErrorResponse ? error.status : undefined;
      if (!(status === 404 && request.context.get(EXPECTED_NOT_FOUND))) {
        reporter.report(error, {
          source: 'http',
          operation: request.method,
          url: request.urlWithParams,
          status
        });
      }
      return throwError(() => error);
    })
  );
};
