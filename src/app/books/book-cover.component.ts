import { ChangeDetectionStrategy, Component, input, linkedSignal } from '@angular/core';

@Component({
  selector: 'app-book-cover',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block overflow-hidden bg-muted-surface' },
  template: `
    <div class="aspect-[3/4]">
      @if (src() && !failed()) {
        <img [src]="src()" [alt]="alt()" (error)="failed.set(true)" class="h-full w-full object-contain" />
      } @else {
        <div class="flex h-full items-center justify-center text-sm font-medium text-muted">No cover available</div>
      }
    </div>
  `
})
export class BookCoverComponent {
  readonly alt = input('');
  readonly src = input('');
  protected readonly failed = linkedSignal({ source: this.src, computation: () => false });
}
