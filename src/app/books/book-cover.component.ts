import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-book-cover',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block overflow-hidden bg-muted-surface' },
  template: `
    <div class="aspect-[3/4]">
      @if (source && !failed) {
        <img [src]="source" [alt]="alt" (error)="failed = true" class="h-full w-full object-contain" />
      } @else {
        <div class="flex h-full items-center justify-center text-sm font-medium text-muted">No cover available</div>
      }
    </div>
  `
})
export class BookCoverComponent {
  @Input() alt = '';
  @Input() set src(value: string) {
    this.source = value;
    this.failed = false;
  }

  protected source = '';
  protected failed = false;
}
