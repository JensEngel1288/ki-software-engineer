import { ChangeDetectionStrategy, Component, computed, input, linkedSignal, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Book } from './book';
import { BookCoverComponent } from './book-cover.component';
import { layoutBookUniverse, UniverseGrouping, universeSize } from './book-universe-layout';

interface MapCamera {
  x: number;
  y: number;
  zoom: number;
}

const overview = (): MapCamera => ({ x: universeSize.width / 2, y: universeSize.height / 2, zoom: 1 });

@Component({
  selector: 'app-book-universe',
  imports: [RouterLink, BookCoverComponent],
  templateUrl: './book-universe.component.html',
  styleUrl: './book-universe.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BookUniverseComponent {
  readonly books = input.required<Book[]>();
  private readonly selectedId = linkedSignal<Book[], string | null>({
    source: this.books,
    computation: (books, previous) => {
      const selected = previous?.value ?? null;
      return books.some(book => book.id === selected) ? selected : (books[0]?.id ?? null);
    }
  });
  protected readonly grouping = signal<UniverseGrouping>('publisher');
  protected readonly camera = linkedSignal({
    source: () => ({ books: this.books(), grouping: this.grouping() }),
    computation: () => overview()
  });
  protected readonly dragging = signal(false);
  protected readonly layout = computed(() => layoutBookUniverse(this.books(), this.grouping()));
  protected readonly selectedBook = computed(() => this.books().find(book => book.id === this.selectedId()) ?? null);
  protected readonly zoomPercent = computed(() => Math.round(this.camera().zoom * 100));
  protected readonly viewBox = computed(() => {
    const { x, y, zoom } = this.camera();
    const width = universeSize.width / zoom;
    const height = universeSize.height / zoom;
    return `${x - width / 2} ${y - height / 2} ${width} ${height}`;
  });
  private drag: { pointerId: number; x: number; y: number; camera: MapCamera; units: number } | null = null;

  protected selectBook(id: string): void {
    this.selectedId.set(id);
  }

  protected chooseBook(id: string): void {
    this.selectBook(id);
    const star = this.layout().stars.find(star => star.book.id === id);
    if (star) this.camera.set({ x: star.x, y: star.y, zoom: 2 });
  }

  protected changeGrouping(grouping: string): void {
    if (grouping !== 'publisher' && grouping !== 'author') return;
    this.grouping.set(grouping);
    this.fitAll();
  }

  protected zoom(factor: number): void {
    this.camera.update(camera => ({ ...camera, zoom: Math.max(0.6, Math.min(3, camera.zoom * factor)) }));
  }

  protected fitAll(): void {
    this.camera.set(overview());
  }

  protected onWheel(event: WheelEvent): void {
    if (!event.ctrlKey && !event.metaKey) return;
    event.preventDefault();
    this.zoom(event.deltaY < 0 ? 1.15 : 1 / 1.15);
  }

  protected startDrag(event: PointerEvent): void {
    if (event.button !== 0 || (event.target as Element).closest('[data-book-star]')) return;
    const svg = event.currentTarget as SVGSVGElement;
    const bounds = svg.getBoundingClientRect();
    const camera = this.camera();
    this.drag = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      camera,
      units: Math.max(universeSize.width / bounds.width, universeSize.height / bounds.height) / camera.zoom
    };
    svg.setPointerCapture(event.pointerId);
    this.dragging.set(true);
    event.preventDefault();
  }

  protected moveDrag(event: PointerEvent): void {
    if (!this.drag || this.drag.pointerId !== event.pointerId) return;
    const { x, y, camera, units } = this.drag;
    this.camera.set({
      ...camera,
      x: Math.max(0, Math.min(universeSize.width, camera.x - (event.clientX - x) * units)),
      y: Math.max(0, Math.min(universeSize.height, camera.y - (event.clientY - y) * units))
    });
  }

  protected endDrag(event: PointerEvent): void {
    if (this.drag?.pointerId !== event.pointerId) return;
    this.drag = null;
    this.dragging.set(false);
    const svg = event.currentTarget as SVGSVGElement;
    if (svg.hasPointerCapture(event.pointerId)) svg.releasePointerCapture(event.pointerId);
  }

  protected onMapKeydown(event: KeyboardEvent): void {
    if (event.target !== event.currentTarget) return;
    const directions: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1]
    };
    const direction = directions[event.key];
    if (direction) {
      event.preventDefault();
      this.camera.update(camera => ({
        ...camera,
        x: Math.max(0, Math.min(universeSize.width, camera.x + (direction[0] * 70) / camera.zoom)),
        y: Math.max(0, Math.min(universeSize.height, camera.y + (direction[1] * 70) / camera.zoom))
      }));
    } else if (['+', '=', '-', 'Home'].includes(event.key)) {
      event.preventDefault();
      if (event.key === 'Home') this.fitAll();
      else this.zoom(event.key === '-' ? 1 / 1.3 : 1.3);
    }
  }

  protected onStarKeydown(event: KeyboardEvent, id: string): void {
    event.stopPropagation();
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.selectBook(id);
      return;
    }
    const stars = this.layout().stars;
    const index = stars.findIndex(star => star.book.id === id);
    let next: number;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        next = (index + 1) % stars.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        next = (index + stars.length - 1) % stars.length;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = stars.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    this.chooseBook(stars[next].book.id);
    const svg = (event.currentTarget as SVGElement).ownerSVGElement;
    svg?.querySelectorAll<SVGElement>('[data-book-star]').item(next)?.focus({ preventScroll: true });
  }
}
