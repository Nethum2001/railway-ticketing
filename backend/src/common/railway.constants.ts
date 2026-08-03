export type SeedStation = {
  name: string;
  sequence: number;
};

export type SeedCoach = {
  code: string;
  name: string;
  description: string;
  baseFare: number;
  travelClass: 'FIRST_CLASS' | 'SECOND_CLASS';
};

export type SeedTrainStop = {
  station: string;
  time: string;
};

export type SeedTrain = {
  trainNo: string;
  trainName: string;
  startingCity: string;
  endingCity: string;
  departureTime: string;
  arrivalTime: string;
  travelTime: string;
  description: string;
  farePerHop: {
    FIRST_CLASS: number;
    SECOND_CLASS: number;
  };
  routeStops: SeedTrainStop[];
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
    name: 'Coach 1',
    description: 'Reserved for first class passengers.',
    baseFare: 120,
    travelClass: 'FIRST_CLASS',
  },
  {
    code: 'R2',
    name: 'Coach 2',
    description: 'Second class coach with balanced seating.',
    baseFare: 110,
    travelClass: 'SECOND_CLASS',
  },
  {
    code: 'R3',
    name: 'Coach 3',
    description: 'Second class overflow coach for higher demand.',
    baseFare: 100,
    travelClass: 'SECOND_CLASS',
  },
];

export const DEFAULT_TRAINS: SeedTrain[] = [
  {
    trainNo: '1001',
    trainName: 'Island Express',
    startingCity: 'Colombo Fort',
    endingCity: 'Badulla',
    departureTime: '05:40',
    arrivalTime: '13:20',
    travelTime: '7h 40m',
    description: 'Fast direct service with segment-based bookings.',
    farePerHop: {
      FIRST_CLASS: 180,
      SECOND_CLASS: 120,
    },
    routeStops: [
      { station: 'Colombo Fort', time: '05:40' },
      { station: 'Maradana', time: '05:49' },
      { station: 'Ragama', time: '06:12' },
      { station: 'Gampaha', time: '06:28' },
      { station: 'Peradeniya', time: '07:48' },
      { station: 'Kandy', time: '08:05' },
      { station: 'Nawalapitiya', time: '08:55' },
      { station: 'Hatton', time: '09:38' },
      { station: 'Nanu Oya', time: '10:30' },
      { station: 'Haputale', time: '11:42' },
      { station: 'Ella', time: '12:18' },
      { station: 'Badulla', time: '13:20' },
    ],
  },
  {
    trainNo: '2044',
    trainName: 'Hill Country Intercity',
    startingCity: 'Colombo Fort',
    endingCity: 'Badulla',
    departureTime: '08:00',
    arrivalTime: '15:48',
    travelTime: '7h 48m',
    description: 'Balanced timing for mixed business and leisure journeys.',
    farePerHop: {
      FIRST_CLASS: 200,
      SECOND_CLASS: 130,
    },
    routeStops: [
      { station: 'Colombo Fort', time: '08:00' },
      { station: 'Maradana', time: '08:09' },
      { station: 'Ragama', time: '08:32' },
      { station: 'Gampaha', time: '08:49' },
      { station: 'Peradeniya', time: '10:12' },
      { station: 'Kandy', time: '10:30' },
      { station: 'Nawalapitiya', time: '11:18' },
      { station: 'Hatton', time: '12:03' },
      { station: 'Nanu Oya', time: '12:55' },
      { station: 'Haputale', time: '14:05' },
      { station: 'Ella', time: '14:42' },
      { station: 'Badulla', time: '15:48' },
    ],
  },
  {
    trainNo: '3090',
    trainName: 'Scenic Valley Limited',
    startingCity: 'Colombo Fort',
    endingCity: 'Badulla',
    departureTime: '12:10',
    arrivalTime: '19:50',
    travelTime: '7h 40m',
    description: 'A slower scenic service with stronger class separation.',
    farePerHop: {
      FIRST_CLASS: 210,
      SECOND_CLASS: 140,
    },
    routeStops: [
      { station: 'Colombo Fort', time: '12:10' },
      { station: 'Maradana', time: '12:18' },
      { station: 'Ragama', time: '12:42' },
      { station: 'Gampaha', time: '12:58' },
      { station: 'Peradeniya', time: '14:20' },
      { station: 'Kandy', time: '14:38' },
      { station: 'Nawalapitiya', time: '15:30' },
      { station: 'Hatton', time: '16:18' },
      { station: 'Nanu Oya', time: '17:05' },
      { station: 'Haputale', time: '18:05' },
      { station: 'Ella', time: '18:36' },
      { station: 'Badulla', time: '19:50' },
    ],
  },
  {
    trainNo: '4102',
    trainName: 'Udarata Return Express',
    startingCity: 'Badulla',
    endingCity: 'Colombo Fort',
    departureTime: '06:10',
    arrivalTime: '13:42',
    travelTime: '7h 32m',
    description: 'Morning return service from the hill country to Colombo.',
    farePerHop: {
      FIRST_CLASS: 190,
      SECOND_CLASS: 125,
    },
    routeStops: [
      { station: 'Badulla', time: '06:10' },
      { station: 'Ella', time: '06:54' },
      { station: 'Haputale', time: '07:28' },
      { station: 'Nanu Oya', time: '08:35' },
      { station: 'Hatton', time: '09:20' },
      { station: 'Nawalapitiya', time: '09:58' },
      { station: 'Kandy', time: '10:55' },
      { station: 'Peradeniya', time: '11:08' },
      { station: 'Gampaha', time: '12:56' },
      { station: 'Ragama', time: '13:15' },
      { station: 'Maradana', time: '13:33' },
      { station: 'Colombo Fort', time: '13:42' },
    ],
  },
  {
    trainNo: '5118',
    trainName: 'Evening Highland Commuter',
    startingCity: 'Badulla',
    endingCity: 'Colombo Fort',
    departureTime: '14:20',
    arrivalTime: '22:05',
    travelTime: '7h 45m',
    description: 'Evening down-country train with balanced class fares.',
    farePerHop: {
      FIRST_CLASS: 205,
      SECOND_CLASS: 135,
    },
    routeStops: [
      { station: 'Badulla', time: '14:20' },
      { station: 'Ella', time: '15:03' },
      { station: 'Haputale', time: '15:37' },
      { station: 'Nanu Oya', time: '16:40' },
      { station: 'Hatton', time: '17:24' },
      { station: 'Nawalapitiya', time: '18:02' },
      { station: 'Kandy', time: '18:58' },
      { station: 'Peradeniya', time: '19:10' },
      { station: 'Gampaha', time: '21:06' },
      { station: 'Ragama', time: '21:29' },
      { station: 'Maradana', time: '21:56' },
      { station: 'Colombo Fort', time: '22:05' },
    ],
  },
];

export const SEAT_NUMBERS = Array.from({ length: 52 }, (_, index) =>
  String(index + 1),
);

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
