export type UserRole = 'CUSTOMER' | 'ADMIN';
export type BookingStatus = 'CONFIRMED' | 'CANCELLED';
export type TravelClass = 'FIRST_CLASS' | 'SECOND_CLASS' | 'THIRD_CLASS';

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
  userId: string;
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
  userId: string;
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