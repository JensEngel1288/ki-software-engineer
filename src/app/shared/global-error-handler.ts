import { DOCUMENT } from '@angular/common';
import { ErrorHandler, inject, Injectable } from '@angular/core';
import { ErrorReporter } from './error-reporter.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly reporter = inject(ErrorReporter);
  private readonly document = inject(DOCUMENT);

  handleError(error: unknown): void {
    this.reporter.report(error, { source: 'runtime', url: this.document.defaultView?.location.pathname });
  }
}
