import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-state-message',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block', '[attr.role]': 'role()' },
  template: `
    <section class="rounded-xl bg-muted-surface px-6 py-16 text-center">
      <ng-content select="[state-title]"></ng-content>
      <p class="text-secondary">{{ message() }}</p>
      <ng-content></ng-content>
    </section>
  `
})
export class StateMessageComponent {
  readonly message = input.required<string>();
  readonly role = input<'status' | 'alert'>('status');
}
