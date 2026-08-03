export type CoachStatus = "available" | "booked";
export type JourneyClass = "FIRST_CLASS" | "SECOND_CLASS";

export type TrainRouteStop = {
  station: string;
  time: string;
};

export type TrainService = {
  trainNo: string;
  trainName: string;
  startingCity: string;
  endingCity: string;
  departureTime: string;
  arrivalTime: string;
  travelTime: string;
  description: string;
  farePerHop: Record<JourneyClass, number>;
  routeStops: TrainRouteStop[];
};

export const stations = [
  "Colombo Fort",
  "Maradana",
  "Ragama",
  "Gampaha",
  "Peradeniya",
  "Kandy",
  "Nawalapitiya",
  "Hatton",
  "Nanu Oya",
  "Haputale",
  "Ella",
  "Badulla",
];

export const coaches = [
  {
    id: "R1",
    description: "Coach 1 is reserved for first class passengers.",
    occupancy: "First class",
  },
  {
    id: "R2",
    description: "Coach 2 is a second class cabin with shared seating.",
    occupancy: "Second class",
  },
  {
    id: "R3",
    description: "Coach 3 is the overflow second class coach.",
    occupancy: "Second class",
  },
];

export const trainServices: TrainService[] = [
  {
    trainNo: "1001",
    trainName: "Island Express",
    startingCity: "Colombo Fort",
    endingCity: "Badulla",
    departureTime: "05:40",
    arrivalTime: "13:20",
    travelTime: "7h 40m",
    description: "Fast direct service with clean segment-based reservations.",
    farePerHop: {
      FIRST_CLASS: 180,
      SECOND_CLASS: 120,
    },
    routeStops: [
      { station: "Colombo Fort", time: "05:40" },
      { station: "Maradana", time: "05:49" },
      { station: "Ragama", time: "06:12" },
      { station: "Gampaha", time: "06:28" },
      { station: "Peradeniya", time: "07:48" },
      { station: "Kandy", time: "08:05" },
      { station: "Nawalapitiya", time: "08:55" },
      { station: "Hatton", time: "09:38" },
      { station: "Nanu Oya", time: "10:30" },
      { station: "Haputale", time: "11:42" },
      { station: "Ella", time: "12:18" },
      { station: "Badulla", time: "13:20" },
    ],
  },
  {
    trainNo: "2044",
    trainName: "Hill Country Intercity",
    startingCity: "Colombo Fort",
    endingCity: "Badulla",
    departureTime: "08:00",
    arrivalTime: "15:48",
    travelTime: "7h 48m",
    description: "Balanced timing for mixed business and leisure journeys.",
    farePerHop: {
      FIRST_CLASS: 200,
      SECOND_CLASS: 130,
    },
    routeStops: [
      { station: "Colombo Fort", time: "08:00" },
      { station: "Maradana", time: "08:09" },
      { station: "Ragama", time: "08:32" },
      { station: "Gampaha", time: "08:49" },
      { station: "Peradeniya", time: "10:12" },
      { station: "Kandy", time: "10:30" },
      { station: "Nawalapitiya", time: "11:18" },
      { station: "Hatton", time: "12:03" },
      { station: "Nanu Oya", time: "12:55" },
      { station: "Haputale", time: "14:05" },
      { station: "Ella", time: "14:42" },
      { station: "Badulla", time: "15:48" },
    ],
  },
  {
    trainNo: "3090",
    trainName: "Scenic Valley Limited",
    startingCity: "Colombo Fort",
    endingCity: "Badulla",
    departureTime: "12:10",
    arrivalTime: "19:50",
    travelTime: "7h 40m",
    description: "A slower scenic service with stronger class separation.",
    farePerHop: {
      FIRST_CLASS: 210,
      SECOND_CLASS: 140,
    },
    routeStops: [
      { station: "Colombo Fort", time: "12:10" },
      { station: "Maradana", time: "12:18" },
      { station: "Ragama", time: "12:42" },
      { station: "Gampaha", time: "12:58" },
      { station: "Peradeniya", time: "14:20" },
      { station: "Kandy", time: "14:38" },
      { station: "Nawalapitiya", time: "15:30" },
      { station: "Hatton", time: "16:18" },
      { station: "Nanu Oya", time: "17:05" },
      { station: "Haputale", time: "18:05" },
      { station: "Ella", time: "18:36" },
      { station: "Badulla", time: "19:50" },
    ],
  },
  {
    trainNo: "4102",
    trainName: "Udarata Return Express",
    startingCity: "Badulla",
    endingCity: "Colombo Fort",
    departureTime: "06:10",
    arrivalTime: "13:42",
    travelTime: "7h 32m",
    description: "Morning return service from the hill country to Colombo.",
    farePerHop: {
      FIRST_CLASS: 190,
      SECOND_CLASS: 125,
    },
    routeStops: [
      { station: "Badulla", time: "06:10" },
      { station: "Ella", time: "06:54" },
      { station: "Haputale", time: "07:28" },
      { station: "Nanu Oya", time: "08:35" },
      { station: "Hatton", time: "09:20" },
      { station: "Nawalapitiya", time: "09:58" },
      { station: "Kandy", time: "10:55" },
      { station: "Peradeniya", time: "11:08" },
      { station: "Gampaha", time: "12:56" },
      { station: "Ragama", time: "13:15" },
      { station: "Maradana", time: "13:33" },
      { station: "Colombo Fort", time: "13:42" },
    ],
  },
  {
    trainNo: "5118",
    trainName: "Evening Highland Commuter",
    startingCity: "Badulla",
    endingCity: "Colombo Fort",
    departureTime: "14:20",
    arrivalTime: "22:05",
    travelTime: "7h 45m",
    description: "Evening down-country train with balanced class fares.",
    farePerHop: {
      FIRST_CLASS: 205,
      SECOND_CLASS: 135,
    },
    routeStops: [
      { station: "Badulla", time: "14:20" },
      { station: "Ella", time: "15:03" },
      { station: "Haputale", time: "15:37" },
      { station: "Nanu Oya", time: "16:40" },
      { station: "Hatton", time: "17:24" },
      { station: "Nawalapitiya", time: "18:02" },
      { station: "Kandy", time: "18:58" },
      { station: "Peradeniya", time: "19:10" },
      { station: "Gampaha", time: "21:06" },
      { station: "Ragama", time: "21:29" },
      { station: "Maradana", time: "21:56" },
      { station: "Colombo Fort", time: "22:05" },
    ],
  },
];

export const seatRows = Array.from({ length: 13 }, (_, index) => index + 1);
export const seatColumns = [1, 2, 3, 4];

export const classCoachMap: Record<JourneyClass, typeof coaches> = {
  FIRST_CLASS: [coaches[0]],
  SECOND_CLASS: [coaches[1], coaches[2]],
};

const seatNumbers = Array.from({ length: 52 }, (_, index) => index + 1);

function buildCoachAvailability(bookedSeats: number[]) {
  return Object.fromEntries(
    seatNumbers.map((seatNumber) => [
      String(seatNumber),
      bookedSeats.includes(seatNumber) ? "booked" : "available",
    ])
  ) as Record<string, CoachStatus>;
}

export const coachAvailability: Record<string, Record<string, CoachStatus>> = {
  R1: buildCoachAvailability([3, 6, 10, 14, 19, 23, 31, 36, 42, 47]),
  R2: buildCoachAvailability([2, 4, 8, 11, 16, 20, 27, 33, 39, 51]),
  R3: buildCoachAvailability([5, 7, 12, 15, 21, 25, 30, 38, 44, 49]),
};

export function getCoachSeats(coachId: string) {
  return coachAvailability[coachId] ?? coachAvailability.R1;
}

export function getFirstAvailableSeat(coachId: string) {
  const seats = getCoachSeats(coachId);
  return Object.entries(seats).find(([, state]) => state === "available")?.[0] ?? "1";
}

export function formatJourneyDate(dateValue: string) {
  if (!dateValue) return "Today";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function buildBookingId(seed: string) {
  const numericSeed = seed.split("").reduce((accumulator, character) => accumulator + character.charCodeAt(0), 0);
  return `BK-2026${String(numericSeed).padStart(6, "0")}`;
}

export function getCoachesForClass(travelClass: JourneyClass) {
  return classCoachMap[travelClass] ?? classCoachMap.SECOND_CLASS;
}

export function getTrainByNumber(trainNo: string) {
  return trainServices.find((service) => service.trainNo === trainNo);
}

export function getJourneyStopIndexes(train: TrainService, originStation: string, destinationStation: string) {
  const originIndex = train.routeStops.findIndex((stop) => stop.station === originStation);
  const destinationIndex = train.routeStops.findIndex((stop) => stop.station === destinationStation);

  if (originIndex < 0 || destinationIndex < 0 || originIndex >= destinationIndex) {
    return null;
  }

  return { originIndex, destinationIndex };
}

export function getTrainsForJourney(originStation: string, destinationStation: string) {
  return trainServices.filter((train) => Boolean(getJourneyStopIndexes(train, originStation, destinationStation)));
}

export function getJourneyPreview(train: TrainService, originStation: string, destinationStation: string) {
  const stopIndexes = getJourneyStopIndexes(train, originStation, destinationStation);

  if (!stopIndexes) {
    return null;
  }

  const originStop = train.routeStops[stopIndexes.originIndex];
  const destinationStop = train.routeStops[stopIndexes.destinationIndex];

  return {
    originStop,
    destinationStop,
    hopCount: stopIndexes.destinationIndex - stopIndexes.originIndex,
    departureTime: originStop.time,
    arrivalTime: destinationStop.time,
    travelTime: `${stopIndexes.destinationIndex - stopIndexes.originIndex} segment${stopIndexes.destinationIndex - stopIndexes.originIndex === 1 ? '' : 's'}`,
  };
}

export function calculateJourneyFare(train: TrainService, originStation: string, destinationStation: string, travelClass: JourneyClass) {
  const journey = getJourneyPreview(train, originStation, destinationStation);

  if (!journey) {
    return 0;
  }

  return journey.hopCount * train.farePerHop[travelClass];
}

export function buildFareMatrix(train: TrainService, travelClass: JourneyClass) {
  return train.routeStops.map((originStop, originIndex) => ({
    originStop,
    cells: train.routeStops.map((destinationStop, destinationIndex) => {
      if (destinationIndex <= originIndex) {
        return null;
      }

      return {
        destinationStop,
        fare: (destinationIndex - originIndex) * train.farePerHop[travelClass],
      };
    }),
  }));
}