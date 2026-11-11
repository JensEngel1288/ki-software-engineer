import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-loading-indicator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div role="status" class="flex flex-col items-center py-20 text-secondary">
      <div
        aria-hidden="true"
        class="h-16 w-16 animate-spin rounded-full border-4 border-divider border-t-accent motion-reduce:animate-none"
      ></div>
      <p class="mt-4">{{ message() }}</p>
    </div>
  `
})
export class LoadingIndicatorComponent {
  readonly message = input('Loading...');
}
