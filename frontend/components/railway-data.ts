export type CoachStatus = "available" | "booked";

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
    description: "Express coach with the best availability.",
    occupancy: "12 booked seats",
  },
  {
    id: "R2",
    description: "Quiet coach with mostly aisle seats left.",
    occupancy: "7 booked seats",
  },
  {
    id: "R3",
    description: "Balanced selection for medium-distance travel.",
    occupancy: "9 booked seats",
  },
];

export const seatRows = Array.from({ length: 13 }, (_, index) => index + 1);
export const seatColumns = [1, 2, 3, 4];

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