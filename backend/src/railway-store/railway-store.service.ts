import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DEFAULT_COACHES, DEFAULT_STATIONS, SEAT_NUMBERS } from '../common/railway.constants';
import {
  AuthenticatedUser,
  BookingRecord,
  CoachRecord,
  IdempotencyRecord,
  SeatRecord,
  StationRecord,
  UserRecord,
} from './railway-store.types';

type SeatLockState = {
  locked: boolean;
  queue: Array<() => void>;
};

export type BookingSearchFilters = {
  coachCode?: string;
  seatNumber?: string;
  originStation?: string;
  destinationStation?: string;
  journeyDate?: string;
};

@Injectable()
export class RailwayStoreService {
  private readonly logger = new Logger(RailwayStoreService.name);
  private readonly users = new Map<string, UserRecord>();
  private readonly usersByEmail = new Map<string, string>();
  private readonly stations = new Map<string, StationRecord>();
  private readonly stationsByName = new Map<string, StationRecord>();
  private readonly coaches = new Map<string, CoachRecord>();
  private readonly seats = new Map<string, SeatRecord>();
  private readonly seatsByCoachAndNumber = new Map<string, SeatRecord>();
  private readonly bookings = new Map<string, BookingRecord>();
  private readonly bookingsByUser = new Map<string, string[]>();
  private readonly idempotency = new Map<string, IdempotencyRecord>();
  private readonly bookingAttempts = new Map<string, number[]>();
  private readonly locks = new Map<string, SeatLockState>();
  private bookingSequence = 0;

  constructor() {
    this.seedStations();
    this.seedCoachesAndSeats();
  }

  getStations(): StationRecord[] {
    return Array.from(this.stations.values()).sort((left, right) => left.sequence - right.sequence);
  }

  getStationByName(name: string) {
    return this.stationsByName.get(name);
  }

  getStationById(id: string) {
    return this.stations.get(id);
  }

  getCoaches(): CoachRecord[] {
    return Array.from(this.coaches.values());
  }

  getCoachByCode(code: string) {
    return this.coaches.get(code);
  }

  getSeatByCoachAndNumber(coachCode: string, seatNumber: string) {
    return this.seatsByCoachAndNumber.get(`${coachCode}:${seatNumber}`);
  }

  getSeatById(seatId: string) {
    return this.seats.get(seatId);
  }

  async createUser(input: { email: string; passwordHash: string; fullName: string; role?: 'CUSTOMER' | 'ADMIN' }) {
    const existing = this.usersByEmail.get(input.email.toLowerCase());

    if (existing) {
      return undefined;
    }

    const user: UserRecord = {
      id: randomUUID(),
      email: input.email.toLowerCase(),
      passwordHash: input.passwordHash,
      fullName: input.fullName,
      role: input.role ?? 'CUSTOMER',
      createdAt: new Date(),
    };

    this.users.set(user.id, user);
    this.usersByEmail.set(user.email, user.id);
    return user;
  }

  findUserByEmail(email: string) {
    const userId = this.usersByEmail.get(email.toLowerCase());
    return userId ? this.users.get(userId) : undefined;
  }

  findUserById(userId: string) {
    return this.users.get(userId);
  }

  async withSeatLock<T>(coachCode: string, seatNumber: string, work: () => Promise<T>): Promise<T> {
    const key = `${coachCode}:${seatNumber}`;
    const state = this.locks.get(key) ?? { locked: false, queue: [] };
    this.locks.set(key, state);

    await new Promise<void>((resolve) => {
      const attempt = () => {
        if (!state.locked) {
          state.locked = true;
          resolve();
          return;
        }

        state.queue.push(attempt);
      };

      attempt();
    });

    try {
      return await work();
    } finally {
      const next = state.queue.shift();

      if (next) {
        next();
      } else {
        state.locked = false;
        if (state.queue.length === 0) {
          this.locks.delete(key);
        }
      }
    }
  }

  getBookedSeatNumbers(filters: BookingSearchFilters): string[] {
    const coach = filters.coachCode ? this.getCoachByCode(filters.coachCode) : undefined;
    const origin = filters.originStation ? this.getStationByName(filters.originStation) : undefined;
    const destination = filters.destinationStation ? this.getStationByName(filters.destinationStation) : undefined;

    if (!coach || !origin || !destination || !filters.journeyDate) {
      return [];
    }

    return Array.from(this.bookings.values())
      .filter((booking) => {
        if (booking.status !== 'CONFIRMED') {
          return false;
        }

        if (booking.coachId !== coach.id || booking.journeyDate !== filters.journeyDate) {
          return false;
        }

        return this.segmentsOverlap(
          booking.originSequence,
          booking.destinationSequence,
          origin.sequence,
          destination.sequence,
        );
      })
      .map((booking) => this.getSeatById(booking.seatId)?.number ?? '')
      .filter(Boolean);
  }

  getAvailableSeatNumbers(filters: BookingSearchFilters): string[] {
    const bookedSeatNumbers = new Set(this.getBookedSeatNumbers(filters));

    return SEAT_NUMBERS.filter((seatNumber) => !bookedSeatNumbers.has(seatNumber));
  }

  getBookingsByUser(userId: string) {
    const bookingIds = this.bookingsByUser.get(userId) ?? [];

    return bookingIds
      .map((bookingId) => this.bookings.get(bookingId))
      .filter((booking): booking is BookingRecord => Boolean(booking))
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());
  }

  findBookingById(bookingId: string) {
    return this.bookings.get(bookingId);
  }

  findBookingByIdempotencyKey(key: string) {
    return this.idempotency.get(key);
  }

  async createBooking(input: Omit<BookingRecord, 'id' | 'bookingCode' | 'createdAt' | 'status'>) {
    const bookingSequence = ++this.bookingSequence;
    const booking: BookingRecord = {
      ...input,
      id: randomUUID(),
      bookingCode: `BK-${new Date().getFullYear()}-${String(bookingSequence).padStart(6, '0')}`,
      createdAt: new Date(),
      status: 'CONFIRMED',
    };

    this.bookings.set(booking.id, booking);
    const userBookings = this.bookingsByUser.get(booking.userId) ?? [];
    userBookings.unshift(booking.id);
    this.bookingsByUser.set(booking.userId, userBookings);

    return booking;
  }

  cancelBooking(bookingId: string, userId: string) {
    const booking = this.bookings.get(bookingId);

    if (!booking || booking.userId !== userId) {
      return undefined;
    }

    booking.status = 'CANCELLED';
    booking.cancelledAt = new Date();
    return booking;
  }

  saveIdempotencyRecord(record: IdempotencyRecord) {
    this.idempotency.set(record.key, record);
  }

  recordBookingAttempt(userId: string) {
    const now = Date.now();
    const attempts = (this.bookingAttempts.get(userId) ?? []).filter((timestamp) => now - timestamp < 60_000);
    attempts.push(now);
    this.bookingAttempts.set(userId, attempts);

    if (attempts.length > 5) {
      return false;
    }

    return true;
  }

  private segmentsOverlap(leftStart: number, leftEnd: number, rightStart: number, rightEnd: number) {
    return leftStart < rightEnd && rightStart < leftEnd;
  }

  private seedStations() {
    for (const station of DEFAULT_STATIONS) {
      const record: StationRecord = {
        id: randomUUID(),
        name: station.name,
        sequence: station.sequence,
        createdAt: new Date(),
      };

      this.stations.set(record.id, record);
      this.stationsByName.set(record.name, record);
    }
  }

  private seedCoachesAndSeats() {
    for (const coach of DEFAULT_COACHES) {
      const coachRecord: CoachRecord = {
        id: randomUUID(),
        code: coach.code,
        name: coach.name,
        description: coach.description,
        baseFare: coach.baseFare,
        createdAt: new Date(),
      };

      this.coaches.set(coachRecord.code, coachRecord);

      for (const seatNumber of SEAT_NUMBERS) {
        const seatRecord: SeatRecord = {
          id: randomUUID(),
          coachId: coachRecord.id,
          number: seatNumber,
          label: `Seat ${seatNumber}`,
          createdAt: new Date(),
        };

        this.seats.set(seatRecord.id, seatRecord);
        this.seatsByCoachAndNumber.set(`${coachRecord.code}:${seatNumber}`, seatRecord);
      }
    }

    this.logger.log(`Seeded ${this.stations.size} stations, ${this.coaches.size} coaches, and ${this.seats.size} seats`);
  }
}