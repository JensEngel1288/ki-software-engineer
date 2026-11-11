import { Book } from './book';

export type UniverseGrouping = 'publisher' | 'author';
export const universeSize = { width: 1200, height: 800 };

export interface BookStar {
  book: Book;
  x: number;
  y: number;
  color: string;
  label: string;
  hitRadius: number;
}

export interface BookConstellation {
  key: string;
  label: string;
  shortLabel: string;
  count: number;
  x: number;
  y: number;
  color: string;
  path: string;
}

const colors = ['#67e8f9', '#c4b5fd', '#fcd34d', '#86efac', '#f9a8d4', '#93c5fd'];
const goldenAngle = Math.PI * (3 - Math.sqrt(5));
const shorten = (text: string, limit: number): string => (text.length > limit ? text.slice(0, limit - 1) + '…' : text);

export function layoutBookUniverse(
  books: Book[],
  grouping: UniverseGrouping
): {
  stars: BookStar[];
  constellations: BookConstellation[];
} {
  const groups = new Map<string, { label: string; books: Book[] }>();
  for (const book of books) {
    const label = book[grouping].trim() || `Unknown ${grouping}`;
    const key = label.toLocaleLowerCase();
    const group = groups.get(key) ?? { label, books: [] };
    group.books.push(book);
    groups.set(key, group);
  }
  const columns = Math.max(
    1,
    Math.min(groups.size, Math.ceil(Math.sqrt((groups.size * universeSize.width) / universeSize.height)))
  );
  const rows = Math.max(1, Math.ceil(groups.size / columns));
  const cellWidth = (universeSize.width - 120) / columns;
  const cellHeight = (universeSize.height - 160) / rows;
  const positioned = new Map<string, BookStar>();
  const constellations = [...groups.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, group], index): BookConstellation => {
      const x = 60 + ((index % columns) + 0.5) * cellWidth + Math.sin(index * 2.4) * cellWidth * 0.08;
      const y = 80 + (Math.floor(index / columns) + 0.5) * cellHeight;
      const radius = Math.min(cellWidth, cellHeight) * 0.32;
      const color = colors[index % colors.length];
      const points = group.books.map((book, starIndex) => {
        const angle = starIndex * goldenAngle + index * 0.8;
        const distance = group.books.length === 1 ? 0 : Math.sqrt((starIndex + 0.5) / group.books.length) * radius;
        const star: BookStar = {
          book,
          x: x + Math.cos(angle) * distance,
          y: y + Math.sin(angle) * distance,
          color,
          label: shorten(book.title, 30),
          hitRadius: Math.min(21, Math.max(5, (radius / Math.sqrt(group.books.length)) * 0.75))
        };
        positioned.set(book.id, star);
        return `${starIndex ? 'L' : 'M'} ${star.x} ${star.y}`;
      });
      return {
        key,
        label: group.label,
        shortLabel: shorten(group.label, Math.max(10, Math.min(30, Math.floor(cellWidth / 9)))),
        count: group.books.length,
        x,
        y: y - (group.books.length === 1 ? 0 : radius) - 28,
        color,
        path: points.join(' ')
      };
    });
  return { stars: books.map(book => positioned.get(book.id)!), constellations };
}
