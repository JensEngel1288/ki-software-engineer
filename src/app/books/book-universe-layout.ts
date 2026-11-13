import { Book } from './book';

export type UniverseGrouping = 'publisher' | 'author';
export const universeSize = { width: 1200, height: 800 };

export interface UniversePoint {
  x: number;
  y: number;
  z: number;
}

export interface UniverseOrientation {
  yaw: number;
  pitch: number;
}

export interface BookStar extends UniversePoint {
  book: Book;
  color: string;
  label: string;
  hitRadius: number;
}

export interface BookConstellation extends UniversePoint {
  key: string;
  label: string;
  shortLabel: string;
  count: number;
  color: string;
  stars: BookStar[];
}

export interface BookUniverseLayout {
  stars: BookStar[];
  constellations: BookConstellation[];
}

const colors = ['#67e8f9', '#c4b5fd', '#fbbf73', '#86efac', '#f9a8d4', '#93c5fd'];
const goldenAngle = Math.PI * (3 - Math.sqrt(5));
const shorten = (text: string, limit: number): string => (text.length > limit ? text.slice(0, limit - 1) + '…' : text);
const noise = (seed: number): number => {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
};

export function layoutBookUniverse(books: Book[], grouping: UniverseGrouping): BookUniverseLayout {
  const groups = new Map<string, { label: string; books: Book[] }>();
  for (const book of books) {
    const label = book[grouping].trim() || `Unknown ${grouping}`;
    const key = label.toLocaleLowerCase();
    const group = groups.get(key) ?? { label, books: [] };
    group.books.push(book);
    groups.set(key, group);
  }
  const positioned = new Map<string, BookStar>();
  const constellations = [...groups.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, group], index): BookConstellation => {
      const angle = index * goldenAngle;
      const distance = groups.size === 1 ? 0 : Math.sqrt((index + 0.7) / groups.size) * 310;
      const x = Math.cos(angle) * distance * 1.12;
      const z = Math.sin(angle) * distance;
      const y = Math.sin(index * 2.4) * 55;
      const radius = groups.size === 1 ? 310 : Math.min(115, 245 / Math.sqrt(groups.size));
      const color = colors[index % colors.length];
      const stars = group.books.map((book, starIndex): BookStar => {
        const angle = starIndex * goldenAngle + index * 0.8;
        const spread = group.books.length === 1 ? 0 : Math.sqrt((starIndex + 0.5) / group.books.length) * radius;
        const star = {
          book,
          x: x + Math.cos(angle) * spread,
          y: y + (noise(starIndex + index * 37) - 0.5) * Math.min(125, radius),
          z: z + Math.sin(angle) * spread,
          color,
          label: shorten(book.title, 30),
          hitRadius: 18
        };
        positioned.set(book.id, star);
        return star;
      });
      return {
        key,
        label: group.label,
        shortLabel: shorten(group.label, 25),
        count: stars.length,
        x,
        y,
        z,
        color,
        stars
      };
    });
  return { stars: books.map(book => positioned.get(book.id)!), constellations };
}

// Rotate in world space, then apply a perspective divide. Positive depth recedes.
export function projectUniversePoint(point: UniversePoint, orientation: UniverseOrientation) {
  const { yaw, pitch } = orientation;
  const x = point.x * Math.cos(yaw) + point.z * Math.sin(yaw);
  const z = -point.x * Math.sin(yaw) + point.z * Math.cos(yaw);
  const y = point.y * Math.cos(pitch) - z * Math.sin(pitch);
  const depth = point.y * Math.sin(pitch) + z * Math.cos(pitch);
  const scale = 1000 / Math.max(450, 1000 + depth);
  return { x: universeSize.width / 2 + x * scale, y: universeSize.height / 2 + y * scale, depth, scale };
}

const dust = Array.from({ length: 320 }, (_, index) => {
  const distance = 45 + Math.sqrt(noise(index)) * 390;
  const angle = (index % 4) * (Math.PI / 2) + distance * 0.011 + noise(index + 800) * 0.65;
  return {
    x: Math.cos(angle) * distance,
    y: (noise(index + 400) - 0.5) * 40,
    z: Math.sin(angle) * distance,
    radius: 0.7 + noise(index + 300) * 2,
    opacity: 0.12 + noise(index + 200) * 0.46,
    color: index % 3 === 0 ? '#c4b5fd' : '#8ddcfb'
  };
});

const backgroundStars = Array.from({ length: 150 }, (_, index) => ({
  x: (noise(index + 1000) - 0.5) * 2300,
  y: (noise(index + 1400) - 0.5) * 1600,
  z: 250 + noise(index + 1800) * 900,
  radius: 0.8 + noise(index + 2200) * 1.5
}));

export function projectBookUniverse(layout: BookUniverseLayout, orientation: UniverseOrientation) {
  const project = (point: UniversePoint) => projectUniversePoint(point, orientation);
  const path = (points: UniversePoint[]) =>
    points
      .map((point, index) => {
        const { x, y } = project(point);
        return `${index ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(' ');
  return {
    // Keep query order for keyboard navigation and the native selector.
    stars: layout.stars.map(star => ({ ...star, ...project(star) })),
    constellations: layout.constellations.map(group => ({
      ...group,
      ...project(group),
      path: path(group.stars)
    })),
    rings: [180, 300, 440].map(radius =>
      path(
        Array.from({ length: 97 }, (_, index) => ({
          x: Math.cos((index / 96) * Math.PI * 2) * radius,
          y: 0,
          z: Math.sin((index / 96) * Math.PI * 2) * radius
        }))
      )
    ),
    dust: dust.map(point => ({ ...point, ...project(point) })),
    backgroundStars: backgroundStars.map(point => ({ ...point, ...project(point) }))
  };
}
