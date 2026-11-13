import { ChangeDetectionStrategy, Component, computed, input, linkedSignal, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Book } from './book';
import { BookCoverComponent } from './book-cover.component';
import {
  layoutBookUniverse,
  projectBookUniverse,
  UniverseGrouping,
  UniverseOrientation,
  universeSize
} from './book-universe-layout';

interface MapCamera extends UniverseOrientation {
  x: number;
  y: number;
  zoom: number;
}

const overview = (): MapCamera => ({
  x: universeSize.width / 2,
  y: universeSize.height / 2,
  zoom: 1,
  yaw: -0.32,
  pitch: -0.62
});

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
  protected readonly scene = computed(() => projectBookUniverse(this.layout(), this.camera()));
  protected readonly orientationLabel = computed(() => {
    const { yaw, pitch } = this.camera();
    return `Orbit ${Math.round((yaw * 180) / Math.PI)}° · Tilt ${Math.round((pitch * 180) / Math.PI)}°`;
  });
  protected readonly coreHeight = computed(() => 35 + Math.abs(Math.sin(this.camera().pitch)) * 115);
  protected readonly selectedConstellation = computed(() =>
    this.layout().constellations.find(group => group.stars.some(star => star.book.id === this.selectedId()))
  );
  protected readonly selectedBook = computed(() => this.books().find(book => book.id === this.selectedId()) ?? null);
  protected readonly zoomPercent = computed(() => Math.round(this.camera().zoom * 100));
  protected readonly viewBox = computed(() => {
    const { x, y, zoom } = this.camera();
    const width = universeSize.width / zoom;
    const height = universeSize.height / zoom;
    return `${x - width / 2} ${y - height / 2} ${width} ${height}`;
  });
  private drag: {
    pointerId: number;
    x: number;
    y: number;
    camera: MapCamera;
    units: number;
    width: number;
    height: number;
    pan: boolean;
  } | null = null;

  protected selectBook(id: string): void {
    this.selectedId.set(id);
  }

  protected chooseBook(id: string): void {
    this.selectBook(id);
    const star = this.scene().stars.find(star => star.book.id === id);
    if (star) this.camera.update(camera => ({ ...camera, x: star.x, y: star.y, zoom: 2 }));
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

  protected rotate(yaw: number, pitch: number): void {
    this.camera.update(camera => ({ ...camera, ...this.boundRotation(camera.yaw + yaw, camera.pitch + pitch) }));
  }

  private boundRotation(yaw: number, pitch: number): UniverseOrientation {
    return { yaw: Math.atan2(Math.sin(yaw), Math.cos(yaw)), pitch: Math.max(-1.2, Math.min(1.2, pitch)) };
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
      width: bounds.width,
      height: bounds.height,
      pan: event.shiftKey,
      units: Math.max(universeSize.width / bounds.width, universeSize.height / bounds.height) / camera.zoom
    };
    svg.setPointerCapture(event.pointerId);
    this.dragging.set(true);
    event.preventDefault();
  }

  protected moveDrag(event: PointerEvent): void {
    if (!this.drag || this.drag.pointerId !== event.pointerId) return;
    const { x, y, camera, units, pan, width, height } = this.drag;
    if (!pan) {
      this.camera.set({
        ...camera,
        ...this.boundRotation(
          camera.yaw + ((event.clientX - x) / width) * 3.4,
          camera.pitch + ((event.clientY - y) / height) * 2
        )
      });
      return;
    }
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
      if (!event.shiftKey) {
        this.rotate(direction[0] * 0.22, direction[1] * 0.16);
        return;
      }
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
