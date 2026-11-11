import { Injectable, signal } from '@angular/core';

export interface ErrorContext {
  source: 'http' | 'runtime' | 'bootstrap';
  operation?: string;
  url?: string;
  status?: number;
}

const reportedErrors = new WeakSet<object>();

export function reportErrorOnce(error: unknown, context: ErrorContext): void {
  if ((typeof error === 'object' && error !== null) || typeof error === 'function') {
    if (reportedErrors.has(error)) {
      return;
    }
    reportedErrors.add(error);
  }
  console.error('BookMonkey error', context, error);
}

@Injectable({ providedIn: 'root' })
export class ErrorReporter {
  private readonly noticeState = signal<string | null>(null);
  readonly notice = this.noticeState.asReadonly();

  report(error: unknown, context: ErrorContext): void {
    reportErrorOnce(error, context);
    if (context.source === 'runtime') {
      this.noticeState.set('Please try again or reload the page if the problem continues.');
    }
  }

  dismissNotice(): void {
    this.noticeState.set(null);
  }
}
