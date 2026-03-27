export interface BreedInfo {
  breed: string;
  sizes: ('TINY' | 'SMALL' | 'MEDIUM' | 'LARGE' | 'EXTRA_LARGE')[];
  colors: string[];
  temperaments: string[][];
  imageUrl: string;
  extraImages: string[];
  ageRange: [number, number];
  priceRange: [number, number];
}

export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

export function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randFloat(min: number, max: number, decimals = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

export function randomDate(daysBack: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - randInt(1, daysBack));
  d.setHours(randInt(0, 23), randInt(0, 59), randInt(0, 59));
  return d;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const PASSWORD_HASH = '$argon2id$v=19$m=65536,t=3,p=4$placeholder_hash_replace_me';

export { PASSWORD_HASH };
