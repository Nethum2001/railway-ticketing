export type SeedStation = {
  name: string;
  sequence: number;
};

export type SeedCoach = {
  code: string;
  name: string;
  description: string;
  baseFare: number;
};

export const DEFAULT_STATIONS: SeedStation[] = [
  { name: 'Colombo Fort', sequence: 0 },
  { name: 'Maradana', sequence: 1 },
  { name: 'Ragama', sequence: 2 },
  { name: 'Gampaha', sequence: 3 },
  { name: 'Peradeniya', sequence: 4 },
  { name: 'Kandy', sequence: 5 },
  { name: 'Nawalapitiya', sequence: 6 },
  { name: 'Hatton', sequence: 7 },
  { name: 'Nanu Oya', sequence: 8 },
  { name: 'Haputale', sequence: 9 },
  { name: 'Ella', sequence: 10 },
  { name: 'Badulla', sequence: 11 },
];

export const DEFAULT_COACHES: SeedCoach[] = [
  {
    code: 'R1',
    name: 'Express Coach R1',
    description: 'Fastest coach with broad seat availability.',
    baseFare: 120,
  },
  {
    code: 'R2',
    name: 'Quiet Coach R2',
    description: 'Balanced coach with a calmer cabin layout.',
    baseFare: 110,
  },
  {
    code: 'R3',
    name: 'Scenic Coach R3',
    description: 'Best for medium-distance scenic rides.',
    baseFare: 100,
  },
];

export const SEAT_NUMBERS = Array.from({ length: 52 }, (_, index) => String(index + 1));

export const CLASS_MULTIPLIERS: Record<string, number> = {
  FIRST_CLASS: 1.5,
  SECOND_CLASS: 1,
  THIRD_CLASS: 0.85,
};

export function normalizeJourneyClass(value: string) {
  const normalized = value.replace(/\s+/g, '_').toUpperCase();
  if (normalized in CLASS_MULTIPLIERS) {
    return normalized;
  }

  return 'SECOND_CLASS';
}