export type UserRole = 'CUSTOMER' | 'ADMIN';
export type BookingStatus = 'CONFIRMED' | 'CANCELLED';
export type TravelClass = 'FIRST_CLASS' | 'SECOND_CLASS' | 'THIRD_CLASS';
export type CoachClass = 'FIRST_CLASS' | 'SECOND_CLASS';

export type SeatHoldRecord = {
  id: string;
  holderKey: string;
  coachId: string;
  seatId: string;
  journeyDate: string;
  originSequence: number;
  destinationSequence: number;
  expiresAt: Date;
};

export type TrainStopRecord = {
  station: string;
  time: string;
  order: number;
};

export type TrainRecord = {
  id: string;
  trainNo: string;
  trainName: string;
  startingCity: string;
  endingCity: string;
  departureTime: string;
  arrivalTime: string;
  travelTime: string;
  description: string;
  createdAt: Date;
  farePerHop: {
    FIRST_CLASS: number;
    SECOND_CLASS: number;
  };
  routeStops: TrainStopRecord[];
};

export type FareRecord = {
  id: string;
  trainId: string;
  originStation: string;
  destinationStation: string;
  travelClass: CoachClass;
  fare: number;
  createdAt: Date;
};

export type UserRecord = {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  role: UserRole;
  createdAt: Date;
};

export type StationRecord = {
  id: string;
  name: string;
  sequence: number;
  createdAt: Date;
};

export type CoachRecord = {
  id: string;
  code: string;
  name: string;
  description: string;
  baseFare: number;
  travelClass: CoachClass;
  createdAt: Date;
};

export type SeatRecord = {
  id: string;
  coachId: string;
  number: string;
  label: string;
  createdAt: Date;
};

export type BookingRecord = {
  id: string;
  bookingCode: string;
  userId?: string | null;
  guestKey?: string | null;
  trainId?: string | null;
  coachId: string;
  seatId: string;
  originStationId: string;
  destinationStationId: string;
  journeyDate: string;
  originSequence: number;
  destinationSequence: number;
  passengerName: string;
  passengerNic: string;
  passengerPhone: string;
  travelClass: TravelClass;
  fare: number;
  status: BookingStatus;
  idempotencyKey?: string;
  createdAt: Date;
  cancelledAt?: Date | null;
};

export type IdempotencyRecord = {
  key: string;
  userId?: string | null;
  guestKey?: string | null;
  bookingId: string;
  responseJson: string;
  createdAt: Date;
};

export type AuthenticatedUser = {
  sub: string;
  email: string;
  role: UserRole;
  fullName: string;
};
