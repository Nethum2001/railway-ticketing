import 'dotenv/config';

import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  Booking,
  Coach,
  Fare,
  IdempotencyKey,
  PrismaClient,
  Seat,
  Station,
  Train,
  TrainStop,
  User,
} from '@prisma/client';
import { randomUUID } from 'crypto';
import {
  FareRecord,
  BookingRecord,
  CoachClass,
  CoachRecord,
  IdempotencyRecord,
  SeatRecord,
  SeatHoldRecord,
  StationRecord,
  TrainRecord,
  UserRole,
  UserRecord,
} from './railway-store.types';
import {
  DEFAULT_COACHES,
  DEFAULT_STATIONS,
  DEFAULT_TRAINS,
  SEAT_NUMBERS,
} from '../common/railway.constants';

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
  holderKey?: string;
};

@Injectable()
export class RailwayStoreService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RailwayStoreService.name);
  private readonly dbTimezone =
    process.env.DB_TIMEZONE?.trim() || 'Asia/Colombo';
  private readonly prisma = new PrismaClient({
    adapter: new PrismaPg({
      connectionString:
        process.env.DATABASE_URL ??
        'postgresql://postgres:familyuser@localhost:5432/train_booking',
    }),
  });
  private readonly users = new Map<string, UserRecord>();
  private readonly usersByEmail = new Map<string, string>();
  private readonly stations = new Map<string, StationRecord>();
  private readonly stationsByName = new Map<string, StationRecord>();
  private readonly coaches = new Map<string, CoachRecord>();
  private readonly trains = new Map<string, TrainRecord>();
  private readonly fares = new Map<string, FareRecord>();
  private readonly seats = new Map<string, SeatRecord>();
  private readonly seatsByCoachAndNumber = new Map<string, SeatRecord>();
  private readonly coachAmenities = new Map<
    string,
    { hasBagRack: boolean; hasToilet: boolean }
  >();
  private readonly bookings = new Map<string, BookingRecord>();
  private readonly bookingsByUser = new Map<string, string[]>();
  private readonly idempotency = new Map<string, IdempotencyRecord>();
  private readonly bookingAttempts = new Map<string, number[]>();
  private readonly locks = new Map<string, SeatLockState>();
  private readonly seatHolds = new Map<string, SeatHoldRecord>();
  private bookingSequence = 0;
  private readonly seatHoldTtlMs = 5 * 60_000;

  async onModuleInit() {
    await this.prisma.$connect();
    await this.configureDatabaseTimezone();
    await this.ensureSeedData();
    await this.loadCaches();
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }

  private async configureDatabaseTimezone() {
    if (!/^[A-Za-z0-9_+\-/]+$/.test(this.dbTimezone)) {
      this.logger.warn(
        `Invalid DB_TIMEZONE value: ${this.dbTimezone}. Falling back to UTC.`,
      );
      await this.prisma.$executeRawUnsafe("SET TIME ZONE 'UTC'");
      return;
    }

    await this.prisma.$executeRawUnsafe(
      `SET TIME ZONE '${this.dbTimezone}'`,
    );
    this.logger.log(`Database timezone set to ${this.dbTimezone}`);
  }

  getStations(): StationRecord[] {
    return Array.from(this.stations.values()).sort(
      (left, right) => left.sequence - right.sequence,
    );
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

  getTrains(): TrainRecord[] {
    return Array.from(this.trains.values());
  }

  getTrainByNumber(trainNo: string) {
    return Array.from(this.trains.values()).find(
      (train) => train.trainNo === trainNo,
    );
  }

  getFaresByTrainNumber(trainNo: string) {
    const train = this.getTrainByNumber(trainNo);

    if (!train) {
      return [];
    }

    return Array.from(this.fares.values()).filter(
      (fare) => fare.trainId === train.id,
    );
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

  async createUser(input: {
    email: string;
    passwordHash: string;
    fullName: string;
    role?: 'CUSTOMER' | 'ADMIN';
  }) {
    const normalizedEmail = input.email.toLowerCase();
    const existing = this.usersByEmail.get(normalizedEmail);

    if (existing) {
      return undefined;
    }

    const createdUser = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        password: input.passwordHash,
        fullName: input.fullName,
        role: input.role ?? 'CUSTOMER',
      },
    });

    const user = this.toUserRecord(createdUser);
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

  getUsersByRole(role: UserRole) {
    return Array.from(this.users.values()).filter((user) => user.role === role);
  }

  async setUserRoleById(userId: string, role: UserRole) {
    const existing = this.users.get(userId);
    if (!existing) {
      return undefined;
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    const user = this.toUserRecord(updated);
    this.users.set(user.id, user);
    this.usersByEmail.set(user.email, user.id);
    return user;
  }

  async setUserRoleByEmail(email: string, role: UserRole) {
    const existing = this.findUserByEmail(email);
    if (!existing) {
      return undefined;
    }

    return this.setUserRoleById(existing.id, role);
  }

  getAllBookings() {
    return Array.from(this.bookings.values());
  }

  async createTrain(input: {
    trainNo: string;
    trainName: string;
    startingCity: string;
    endingCity: string;
    departureTime: string;
    arrivalTime: string;
    travelTime: string;
    description: string;
    farePerHop: { FIRST_CLASS: number; SECOND_CLASS: number };
    routeStops: Array<{ station: string; time: string }>;
  }) {
    const existing = this.getTrainByNumber(input.trainNo);
    if (existing) {
      return undefined;
    }

    await this.prisma.$transaction(async (tx) => {
      const createdTrain = await tx.train.create({
        data: {
          trainNo: input.trainNo,
          trainName: input.trainName,
          startingCity: input.startingCity,
          endingCity: input.endingCity,
          departureTime: input.departureTime,
          arrivalTime: input.arrivalTime,
          travelTime: input.travelTime,
          description: input.description,
          firstClassFarePerHop: input.farePerHop.FIRST_CLASS,
          secondClassFarePerHop: input.farePerHop.SECOND_CLASS,
        },
      });

      await tx.trainStop.createMany({
        data: input.routeStops.map((stop, index) => ({
          trainId: createdTrain.id,
          station: stop.station,
          time: stop.time,
          stopOrder: index,
        })),
      });

      await tx.fare.createMany({
        data: this.buildFareRows(
          createdTrain.id,
          input.routeStops,
          input.farePerHop,
        ),
      });
    });

    await this.loadCaches();
    return this.getTrainByNumber(input.trainNo);
  }

  async updateTrain(
    trainNo: string,
    input: Partial<{
      trainName: string;
      startingCity: string;
      endingCity: string;
      departureTime: string;
      arrivalTime: string;
      travelTime: string;
      description: string;
      farePerHop: { FIRST_CLASS: number; SECOND_CLASS: number };
      routeStops: Array<{ station: string; time: string }>;
    }>,
  ) {
    const existingTrain = this.getTrainByNumber(trainNo);
    if (!existingTrain) {
      return undefined;
    }

    const nextRouteStops =
      input.routeStops?.map((stop) => ({
        station: stop.station,
        time: stop.time,
      })) ??
      existingTrain.routeStops
        .slice()
        .sort((left, right) => left.order - right.order)
        .map((stop) => ({ station: stop.station, time: stop.time }));
    const nextFarePerHop = input.farePerHop ?? existingTrain.farePerHop;

    await this.prisma.$transaction(async (tx) => {
      await tx.train.update({
        where: { id: existingTrain.id },
        data: {
          trainName: input.trainName,
          startingCity: input.startingCity,
          endingCity: input.endingCity,
          departureTime: input.departureTime,
          arrivalTime: input.arrivalTime,
          travelTime: input.travelTime,
          description: input.description,
          firstClassFarePerHop: nextFarePerHop.FIRST_CLASS,
          secondClassFarePerHop: nextFarePerHop.SECOND_CLASS,
        },
      });

      await tx.trainStop.deleteMany({ where: { trainId: existingTrain.id } });
      await tx.fare.deleteMany({ where: { trainId: existingTrain.id } });

      await tx.trainStop.createMany({
        data: nextRouteStops.map((stop, index) => ({
          trainId: existingTrain.id,
          station: stop.station,
          time: stop.time,
          stopOrder: index,
        })),
      });

      await tx.fare.createMany({
        data: this.buildFareRows(existingTrain.id, nextRouteStops, nextFarePerHop),
      });
    });

    await this.loadCaches();
    return this.getTrainByNumber(trainNo);
  }

  async removeTrain(trainNo: string) {
    const existing = this.getTrainByNumber(trainNo);
    if (!existing) {
      return false;
    }

    await this.prisma.train.delete({ where: { id: existing.id } });
    await this.loadCaches();
    return true;
  }

  async createCoach(input: {
    code: string;
    name: string;
    description: string;
    baseFare: number;
    travelClass: CoachClass;
    hasBagRack?: boolean;
    hasToilet?: boolean;
  }) {
    if (this.getCoachByCode(input.code)) {
      return undefined;
    }

    const createdCoach = await this.prisma.coach.create({
      data: {
        code: input.code,
        name: input.name,
        description: input.description,
        baseFare: input.baseFare,
        travelClass: input.travelClass,
      },
    });

    await this.prisma.seat.createMany({
      data: SEAT_NUMBERS.map((seatNumber) => ({
        coachId: createdCoach.id,
        number: seatNumber,
        label: `Seat ${seatNumber}`,
      })),
    });

    this.coachAmenities.set(createdCoach.code, {
      hasBagRack:
        input.hasBagRack ??
        this.defaultCoachAmenities(createdCoach.travelClass).hasBagRack,
      hasToilet:
        input.hasToilet ??
        this.defaultCoachAmenities(createdCoach.travelClass).hasToilet,
    });

    await this.loadCaches();
    return this.getCoachByCode(createdCoach.code);
  }

  async removeCoach(coachCode: string) {
    const coach = this.getCoachByCode(coachCode);
    if (!coach) {
      return 'NOT_FOUND' as const;
    }

    const hasBookings = Array.from(this.bookings.values()).some(
      (booking) => booking.coachId === coach.id,
    );

    if (hasBookings) {
      return 'HAS_BOOKINGS' as const;
    }

    await this.prisma.coach.delete({ where: { id: coach.id } });
    this.coachAmenities.delete(coachCode);
    await this.loadCaches();
    return 'REMOVED' as const;
  }

  async updateCoachAmenities(
    coachCode: string,
    input: { hasBagRack?: boolean; hasToilet?: boolean },
  ) {
    const coach = this.getCoachByCode(coachCode);
    if (!coach) {
      return undefined;
    }

    const nextAmenities = {
      hasBagRack: input.hasBagRack ?? coach.hasBagRack,
      hasToilet: input.hasToilet ?? coach.hasToilet,
    };

    this.coachAmenities.set(coachCode, nextAmenities);
    const updatedCoach: CoachRecord = {
      ...coach,
      hasBagRack: nextAmenities.hasBagRack,
      hasToilet: nextAmenities.hasToilet,
    };
    this.coaches.set(coachCode, updatedCoach);
    return updatedCoach;
  }

  async withSeatLock<T>(
    coachCode: string,
    seatNumber: string,
    work: () => Promise<T>,
  ): Promise<T> {
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
    this.purgeExpiredSeatHolds();

    const coach = filters.coachCode
      ? this.getCoachByCode(filters.coachCode)
      : undefined;
    const origin = filters.originStation
      ? this.getStationByName(filters.originStation)
      : undefined;
    const destination = filters.destinationStation
      ? this.getStationByName(filters.destinationStation)
      : undefined;

    if (!coach || !origin || !destination || !filters.journeyDate) {
      return [];
    }

    const confirmedSeatNumbers = Array.from(this.bookings.values())
      .filter((booking) => {
        if (booking.status !== 'CONFIRMED') {
          return false;
        }

        if (
          booking.coachId !== coach.id ||
          booking.journeyDate !== filters.journeyDate
        ) {
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

    const heldSeatNumbers = Array.from(this.seatHolds.values())
      .filter((hold) => {
        if (
          hold.coachId !== coach.id ||
          hold.journeyDate !== filters.journeyDate
        ) {
          return false;
        }

        if (filters.holderKey && hold.holderKey === filters.holderKey) {
          return false;
        }

        return this.segmentsOverlap(
          hold.originSequence,
          hold.destinationSequence,
          origin.sequence,
          destination.sequence,
        );
      })
      .map((hold) => this.getSeatById(hold.seatId)?.number ?? '')
      .filter(Boolean);

    return Array.from(new Set([...confirmedSeatNumbers, ...heldSeatNumbers]));
  }

  holdSeats(input: {
    holderKey: string;
    coachCode: string;
    seatNumbers: string[];
    originStation: string;
    destinationStation: string;
    journeyDate: string;
  }) {
    this.purgeExpiredSeatHolds();

    const coach = this.getCoachByCode(input.coachCode);
    const origin = this.getStationByName(input.originStation);
    const destination = this.getStationByName(input.destinationStation);

    if (!coach || !origin || !destination) {
      return {
        success: false,
        message: 'Coach or station not found',
      };
    }

    if (origin.sequence >= destination.sequence) {
      return {
        success: false,
        message: 'Destination must be after the origin station',
      };
    }

    const uniqueSeatNumbers = Array.from(
      new Set(input.seatNumbers.map((seat) => seat.trim()).filter(Boolean)),
    );

    for (const seatNumber of uniqueSeatNumbers) {
      const seat = this.getSeatByCoachAndNumber(input.coachCode, seatNumber);
      if (!seat) {
        return {
          success: false,
          message: `Seat ${seatNumber} is invalid for ${input.coachCode}`,
        };
      }
    }

    const unavailableSeats = this.getBookedSeatNumbers({
      coachCode: input.coachCode,
      originStation: input.originStation,
      destinationStation: input.destinationStation,
      journeyDate: input.journeyDate,
      holderKey: input.holderKey,
    });

    const conflictSeat = uniqueSeatNumbers.find((seatNumber) =>
      unavailableSeats.includes(seatNumber),
    );

    if (conflictSeat) {
      return {
        success: false,
        message: `Seat ${conflictSeat} is no longer available`,
      };
    }

    const now = Date.now();
    const expiresAt = new Date(now + this.seatHoldTtlMs);

    for (const seatHold of Array.from(this.seatHolds.values())) {
      if (
        seatHold.holderKey === input.holderKey &&
        seatHold.coachId === coach.id &&
        seatHold.journeyDate === input.journeyDate
      ) {
        this.seatHolds.delete(seatHold.id);
      }
    }

    for (const seatNumber of uniqueSeatNumbers) {
      const seat = this.getSeatByCoachAndNumber(input.coachCode, seatNumber);

      if (!seat) {
        continue;
      }

      const hold: SeatHoldRecord = {
        id: randomUUID(),
        holderKey: input.holderKey,
        coachId: coach.id,
        seatId: seat.id,
        journeyDate: input.journeyDate,
        originSequence: origin.sequence,
        destinationSequence: destination.sequence,
        expiresAt,
      };

      this.seatHolds.set(hold.id, hold);
    }

    return {
      success: true,
      expiresAt: expiresAt.toISOString(),
    };
  }

  releaseSeatHold(input: {
    holderKey: string;
    coachCode: string;
    seatNumber: string;
    journeyDate: string;
    originStation: string;
    destinationStation: string;
  }) {
    this.purgeExpiredSeatHolds();

    const coach = this.getCoachByCode(input.coachCode);
    const seat = this.getSeatByCoachAndNumber(
      input.coachCode,
      input.seatNumber,
    );
    const origin = this.getStationByName(input.originStation);
    const destination = this.getStationByName(input.destinationStation);

    if (!coach || !seat || !origin || !destination) {
      return;
    }

    for (const hold of Array.from(this.seatHolds.values())) {
      if (
        hold.holderKey !== input.holderKey ||
        hold.coachId !== coach.id ||
        hold.seatId !== seat.id ||
        hold.journeyDate !== input.journeyDate
      ) {
        continue;
      }

      if (
        this.segmentsOverlap(
          hold.originSequence,
          hold.destinationSequence,
          origin.sequence,
          destination.sequence,
        )
      ) {
        this.seatHolds.delete(hold.id);
      }
    }
  }

  getAvailableSeatNumbers(filters: BookingSearchFilters): string[] {
    const bookedSeatNumbers = new Set(this.getBookedSeatNumbers(filters));

    return SEAT_NUMBERS.filter(
      (seatNumber) => !bookedSeatNumbers.has(seatNumber),
    );
  }

  getBookingsByUser(userId: string) {
    const bookingIds = this.bookingsByUser.get(userId) ?? [];

    return bookingIds
      .map((bookingId) => this.bookings.get(bookingId))
      .filter((booking): booking is BookingRecord => Boolean(booking))
      .sort(
        (left, right) => right.createdAt.getTime() - left.createdAt.getTime(),
      );
  }

  findBookingById(bookingId: string) {
    return this.bookings.get(bookingId);
  }

  findBookingByIdempotencyKey(key: string) {
    return this.idempotency.get(key);
  }

  async createBooking(
    input: Omit<BookingRecord, 'id' | 'bookingCode' | 'createdAt' | 'status'>,
  ) {
    const bookingSequence = ++this.bookingSequence;
    const createdBooking = await this.prisma.booking.create({
      data: {
        bookingCode: `BK-${new Date().getFullYear()}-${String(bookingSequence).padStart(6, '0')}`,
        userId: input.userId ?? null,
        guestKey: input.guestKey ?? null,
        trainId: input.trainId ?? null,
        coachId: input.coachId,
        seatId: input.seatId,
        originStationId: input.originStationId,
        destinationStationId: input.destinationStationId,
        journeyDate: this.toJourneyDate(input.journeyDate),
        originSequence: input.originSequence,
        destinationSequence: input.destinationSequence,
        passengerName: input.passengerName,
        passengerNic: input.passengerNic,
        passengerPhone: input.passengerPhone,
        travelClass: input.travelClass,
        fare: input.fare,
        idempotencyKey: input.idempotencyKey ?? null,
      },
    });

    const booking = this.toBookingRecord(createdBooking);
    this.bookings.set(booking.id, booking);
    if (booking.userId) {
      const userBookings = this.bookingsByUser.get(booking.userId) ?? [];
      userBookings.unshift(booking.id);
      this.bookingsByUser.set(booking.userId, userBookings);
    }

    return booking;
  }

  async cancelBooking(bookingId: string, userId: string) {
    const booking = this.bookings.get(bookingId);

    if (!booking || booking.userId !== userId) {
      return undefined;
    }

    const updatedBooking = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    });

    const nextBooking = this.toBookingRecord(updatedBooking);
    this.bookings.set(nextBooking.id, nextBooking);
    return nextBooking;
  }

  async saveIdempotencyRecord(record: IdempotencyRecord) {
    const savedRecord = await this.prisma.idempotencyKey.create({
      data: {
        key: record.key,
        userId: record.userId ?? null,
        guestKey: record.guestKey ?? null,
        bookingId: record.bookingId,
        responseJson: record.responseJson,
      },
    });

    this.idempotency.set(
      savedRecord.key,
      this.toIdempotencyRecord(savedRecord),
    );
  }

  recordBookingAttempt(userId: string) {
    const now = Date.now();
    const attempts = (this.bookingAttempts.get(userId) ?? []).filter(
      (timestamp) => now - timestamp < 60_000,
    );
    attempts.push(now);
    this.bookingAttempts.set(userId, attempts);

    if (attempts.length > 5) {
      return false;
    }

    return true;
  }

  private segmentsOverlap(
    leftStart: number,
    leftEnd: number,
    rightStart: number,
    rightEnd: number,
  ) {
    return leftStart < rightEnd && rightStart < leftEnd;
  }

  private purgeExpiredSeatHolds() {
    const now = Date.now();
    for (const hold of Array.from(this.seatHolds.values())) {
      if (hold.expiresAt.getTime() <= now) {
        this.seatHolds.delete(hold.id);
      }
    }
  }

  private async ensureSeedData() {
    if ((await this.prisma.station.count()) === 0) {
      await this.prisma.station.createMany({
        data: DEFAULT_STATIONS.map((station) => ({
          name: station.name,
          sequence: station.sequence,
        })),
      });
    }

    if ((await this.prisma.coach.count()) === 0) {
      for (const coach of DEFAULT_COACHES) {
        const createdCoach = await this.prisma.coach.create({
          data: {
            code: coach.code,
            name: coach.name,
            description: coach.description,
            baseFare: coach.baseFare,
            travelClass: coach.travelClass,
          },
        });

        await this.prisma.seat.createMany({
          data: SEAT_NUMBERS.map((seatNumber) => ({
            coachId: createdCoach.id,
            number: seatNumber,
            label: `Seat ${seatNumber}`,
          })),
        });
      }
    }

    for (const train of DEFAULT_TRAINS) {
      const persistedTrain = await this.prisma.train.upsert({
        where: { trainNo: train.trainNo },
        update: {
          trainName: train.trainName,
          startingCity: train.startingCity,
          endingCity: train.endingCity,
          departureTime: train.departureTime,
          arrivalTime: train.arrivalTime,
          travelTime: train.travelTime,
          description: train.description,
          firstClassFarePerHop: train.farePerHop.FIRST_CLASS,
          secondClassFarePerHop: train.farePerHop.SECOND_CLASS,
        },
        create: {
          trainNo: train.trainNo,
          trainName: train.trainName,
          startingCity: train.startingCity,
          endingCity: train.endingCity,
          departureTime: train.departureTime,
          arrivalTime: train.arrivalTime,
          travelTime: train.travelTime,
          description: train.description,
          firstClassFarePerHop: train.farePerHop.FIRST_CLASS,
          secondClassFarePerHop: train.farePerHop.SECOND_CLASS,
        },
      });

      await this.prisma.trainStop.deleteMany({
        where: { trainId: persistedTrain.id },
      });
      await this.prisma.fare.deleteMany({
        where: { trainId: persistedTrain.id },
      });

      await this.prisma.trainStop.createMany({
        data: train.routeStops.map((stop, order) => ({
          trainId: persistedTrain.id,
          station: stop.station,
          time: stop.time,
          stopOrder: order,
        })),
      });

      await this.prisma.fare.createMany({
        data: train.routeStops.flatMap((originStop, originIndex) =>
          train.routeStops.flatMap((destinationStop, destinationIndex) => {
            if (destinationIndex <= originIndex) {
              return [];
            }

            return [
              {
                trainId: persistedTrain.id,
                originStation: originStop.station,
                destinationStation: destinationStop.station,
                travelClass: 'FIRST_CLASS' as const,
                fare:
                  (destinationIndex - originIndex) *
                  train.farePerHop.FIRST_CLASS,
              },
              {
                trainId: persistedTrain.id,
                originStation: originStop.station,
                destinationStation: destinationStop.station,
                travelClass: 'SECOND_CLASS' as const,
                fare:
                  (destinationIndex - originIndex) *
                  train.farePerHop.SECOND_CLASS,
              },
            ];
          }),
        ),
      });
    }

    await this.ensureDemoBookings();
    await this.ensureBootstrapAdmin();
  }

  private async ensureBootstrapAdmin() {
    const adminEmail = 'testadmin@test.test';
    const existingAdmin = await this.prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (existingAdmin) {
      if (existingAdmin.role !== 'ADMIN') {
        await this.prisma.user.update({
          where: { id: existingAdmin.id },
          data: { role: 'ADMIN' },
        });
      }
      return;
    }

    const fallbackPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD ?? 'admin12345';
    const { hash } = await import('bcryptjs');
    const passwordHash = await hash(fallbackPassword, 10);

    await this.prisma.user.create({
      data: {
        email: adminEmail,
        fullName: 'System Admin',
        password: passwordHash,
        role: 'ADMIN',
      },
    });
  }

  private async ensureDemoBookings() {
    const demoBookingCodes = [
      'DEMO-SEG-001',
      'DEMO-SEG-002',
      'DEMO-SEG-003',
      'DEMO-SEG-004',
      'DEMO-SEG-005',
      'DEMO-SEG-006',
      'DEMO-SEG-007',
      'DEMO-SEG-008',
      'DEMO-SEG-009',
      'DEMO-SEG-010',
    ];

    const existingDemoBookings = await this.prisma.booking.findMany({
      where: { bookingCode: { in: demoBookingCodes } },
      select: { bookingCode: true },
    });

    const existingCodes = new Set(
      existingDemoBookings.map((booking) => booking.bookingCode),
    );
    if (existingCodes.size === demoBookingCodes.length) {
      return;
    }

    const [stations, trains, coaches, seats] = await Promise.all([
      this.prisma.station.findMany(),
      this.prisma.train.findMany(),
      this.prisma.coach.findMany(),
      this.prisma.seat.findMany({ include: { coach: true } }),
    ]);

    const stationByName = new Map(
      stations.map((station) => [station.name, station]),
    );
    const trainByNo = new Map(trains.map((train) => [train.trainNo, train]));
    const coachByCode = new Map(coaches.map((coach) => [coach.code, coach]));
    const seatByCoachAndNumber = new Map(
      seats.map((seat) => [`${seat.coach.code}:${seat.number}`, seat]),
    );

    const demoSeeds: Array<{
      bookingCode: string;
      trainNo: string;
      coachCode: string;
      seatNumber: string;
      originStation: string;
      destinationStation: string;
      journeyDate: string;
      passengerName: string;
      passengerNic: string;
      passengerPhone: string;
      travelClass: 'FIRST_CLASS' | 'SECOND_CLASS';
      fare: number;
    }> = [
      {
        bookingCode: 'DEMO-SEG-001',
        trainNo: '1001',
        coachCode: 'R1',
        seatNumber: '3',
        originStation: 'Colombo Fort',
        destinationStation: 'Peradeniya',
        journeyDate: '2026-08-12',
        passengerName: 'A. Perera',
        passengerNic: '901245678V',
        passengerPhone: '0771001001',
        travelClass: 'FIRST_CLASS',
        fare: 720,
      },
      {
        bookingCode: 'DEMO-SEG-002',
        trainNo: '1001',
        coachCode: 'R2',
        seatNumber: '8',
        originStation: 'Maradana',
        destinationStation: 'Kandy',
        journeyDate: '2026-08-12',
        passengerName: 'N. Fernando',
        passengerNic: '920345112V',
        passengerPhone: '0771001002',
        travelClass: 'SECOND_CLASS',
        fare: 520,
      },
      {
        bookingCode: 'DEMO-SEG-003',
        trainNo: '2044',
        coachCode: 'R3',
        seatNumber: '11',
        originStation: 'Ragama',
        destinationStation: 'Hatton',
        journeyDate: '2026-08-12',
        passengerName: 'K. Silva',
        passengerNic: '931122334V',
        passengerPhone: '0771001003',
        travelClass: 'SECOND_CLASS',
        fare: 500,
      },
      {
        bookingCode: 'DEMO-SEG-004',
        trainNo: '2044',
        coachCode: 'R1',
        seatNumber: '14',
        originStation: 'Gampaha',
        destinationStation: 'Nanu Oya',
        journeyDate: '2026-08-12',
        passengerName: 'P. Jayasena',
        passengerNic: '891110111V',
        passengerPhone: '0771001004',
        travelClass: 'FIRST_CLASS',
        fare: 1080,
      },
      {
        bookingCode: 'DEMO-SEG-005',
        trainNo: '3090',
        coachCode: 'R2',
        seatNumber: '20',
        originStation: 'Peradeniya',
        destinationStation: 'Ella',
        journeyDate: '2026-08-12',
        passengerName: 'L. Raman',
        passengerNic: '880056789V',
        passengerPhone: '0771001005',
        travelClass: 'SECOND_CLASS',
        fare: 720,
      },
      {
        bookingCode: 'DEMO-SEG-006',
        trainNo: '3090',
        coachCode: 'R3',
        seatNumber: '25',
        originStation: 'Kandy',
        destinationStation: 'Badulla',
        journeyDate: '2026-08-12',
        passengerName: 'S. Kumara',
        passengerNic: '990012344V',
        passengerPhone: '0771001006',
        travelClass: 'SECOND_CLASS',
        fare: 700,
      },
      {
        bookingCode: 'DEMO-SEG-007',
        trainNo: '1001',
        coachCode: 'R1',
        seatNumber: '31',
        originStation: 'Nawalapitiya',
        destinationStation: 'Badulla',
        journeyDate: '2026-08-12',
        passengerName: 'M. Wijeratne',
        passengerNic: '900001239V',
        passengerPhone: '0771001007',
        travelClass: 'FIRST_CLASS',
        fare: 900,
      },
      {
        bookingCode: 'DEMO-SEG-008',
        trainNo: '2044',
        coachCode: 'R2',
        seatNumber: '33',
        originStation: 'Hatton',
        destinationStation: 'Badulla',
        journeyDate: '2026-08-12',
        passengerName: 'T. Dissanayake',
        passengerNic: '870002222V',
        passengerPhone: '0771001008',
        travelClass: 'SECOND_CLASS',
        fare: 480,
      },
      {
        bookingCode: 'DEMO-SEG-009',
        trainNo: '3090',
        coachCode: 'R3',
        seatNumber: '39',
        originStation: 'Nanu Oya',
        destinationStation: 'Badulla',
        journeyDate: '2026-08-12',
        passengerName: 'R. Fernando',
        passengerNic: '860009876V',
        passengerPhone: '0771001009',
        travelClass: 'SECOND_CLASS',
        fare: 300,
      },
      {
        bookingCode: 'DEMO-SEG-010',
        trainNo: '2044',
        coachCode: 'R1',
        seatNumber: '42',
        originStation: 'Haputale',
        destinationStation: 'Badulla',
        journeyDate: '2026-08-12',
        passengerName: 'J. Lakshan',
        passengerNic: '950005555V',
        passengerPhone: '0771001010',
        travelClass: 'FIRST_CLASS',
        fare: 360,
      },
    ];

    for (const seed of demoSeeds) {
      if (existingCodes.has(seed.bookingCode)) {
        continue;
      }

      const originStation = stationByName.get(seed.originStation);
      const destinationStation = stationByName.get(seed.destinationStation);
      const coach = coachByCode.get(seed.coachCode);
      const seat = seatByCoachAndNumber.get(
        `${seed.coachCode}:${seed.seatNumber}`,
      );
      const train = trainByNo.get(seed.trainNo);

      if (!originStation || !destinationStation || !coach || !seat) {
        this.logger.warn(
          `Skipping demo booking seed ${seed.bookingCode} due to missing dependencies`,
        );
        continue;
      }

      await this.prisma.booking.create({
        data: {
          bookingCode: seed.bookingCode,
          guestKey: `demo:${seed.passengerNic.toLowerCase()}`,
          trainId: train?.id ?? null,
          coachId: coach.id,
          seatId: seat.id,
          originStationId: originStation.id,
          destinationStationId: destinationStation.id,
          journeyDate: this.toJourneyDate(seed.journeyDate),
          originSequence: originStation.sequence,
          destinationSequence: destinationStation.sequence,
          passengerName: seed.passengerName,
          passengerNic: seed.passengerNic,
          passengerPhone: seed.passengerPhone,
          travelClass: seed.travelClass,
          fare: seed.fare,
          status: 'CONFIRMED',
        },
      });
    }
  }

  private async loadCaches() {
    this.users.clear();
    this.usersByEmail.clear();
    this.stations.clear();
    this.stationsByName.clear();
    this.coaches.clear();
    this.trains.clear();
    this.fares.clear();
    this.seats.clear();
    this.seatsByCoachAndNumber.clear();
    this.coachAmenities.clear();
    this.bookings.clear();
    this.bookingsByUser.clear();
    this.idempotency.clear();

    const [
      users,
      stations,
      coaches,
      trains,
      fares,
      seats,
      bookings,
      idempotencyRecords,
    ] = await Promise.all([
      this.prisma.user.findMany(),
      this.prisma.station.findMany(),
      this.prisma.coach.findMany(),
      this.prisma.train.findMany({ include: { stops: true } }),
      this.prisma.fare.findMany(),
      this.prisma.seat.findMany({ include: { coach: true } }),
      this.prisma.booking.findMany(),
      this.prisma.idempotencyKey.findMany(),
    ]);

    for (const user of users) {
      const record = this.toUserRecord(user);
      this.users.set(record.id, record);
      this.usersByEmail.set(record.email, record.id);
    }

    for (const station of stations) {
      const record = this.toStationRecord(station);
      this.stations.set(record.id, record);
      this.stationsByName.set(record.name, record);
    }

    for (const coach of coaches) {
      this.coachAmenities.set(
        coach.code,
        this.defaultCoachAmenities(coach.travelClass),
      );
      const record = this.toCoachRecord(coach);
      this.coaches.set(record.code, record);
    }

    for (const train of trains) {
      const record = this.toTrainRecord(train, train.stops);
      this.trains.set(record.trainNo, record);
    }

    for (const fare of fares) {
      const record = this.toFareRecord(fare);
      this.fares.set(record.id, record);
    }

    for (const seat of seats) {
      const record = this.toSeatRecord(seat);
      this.seats.set(record.id, record);
      this.seatsByCoachAndNumber.set(
        `${seat.coach.code}:${record.number}`,
        record,
      );
    }

    for (const booking of bookings) {
      const record = this.toBookingRecord(booking);
      this.bookings.set(record.id, record);

      if (record.userId) {
        const userBookings = this.bookingsByUser.get(record.userId) ?? [];
        userBookings.push(record.id);
        this.bookingsByUser.set(record.userId, userBookings);
      }

      const sequence = this.extractBookingSequence(record.bookingCode);
      if (sequence > this.bookingSequence) {
        this.bookingSequence = sequence;
      }
    }

    for (const userBookingIds of this.bookingsByUser.values()) {
      userBookingIds.sort((left, right) => {
        const leftBooking = this.bookings.get(left);
        const rightBooking = this.bookings.get(right);
        return (
          (rightBooking?.createdAt.getTime() ?? 0) -
          (leftBooking?.createdAt.getTime() ?? 0)
        );
      });
    }

    for (const idempotencyRecord of idempotencyRecords) {
      const record = this.toIdempotencyRecord(idempotencyRecord);
      this.idempotency.set(record.key, record);
    }

    this.logger.log(
      `Loaded ${stations.length} stations, ${coaches.length} coaches, ${seats.length} seats, ${trains.length} trains, and ${bookings.length} bookings from Postgres`,
    );
  }

  private toUserRecord(user: User): UserRecord {
    return {
      id: user.id,
      email: user.email,
      passwordHash: user.password,
      fullName: user.fullName,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  private toStationRecord(station: Station): StationRecord {
    return {
      id: station.id,
      name: station.name,
      sequence: station.sequence,
      createdAt: station.createdAt,
    };
  }

  private toCoachRecord(coach: Coach): CoachRecord {
    const amenities =
      this.coachAmenities.get(coach.code) ??
      this.defaultCoachAmenities(coach.travelClass);
    return {
      id: coach.id,
      code: coach.code,
      name: coach.name,
      description: coach.description,
      baseFare: coach.baseFare,
      travelClass: coach.travelClass,
      hasBagRack: amenities.hasBagRack,
      hasToilet: amenities.hasToilet,
      createdAt: coach.createdAt,
    };
  }

  private defaultCoachAmenities(travelClass: CoachClass) {
    if (travelClass === 'FIRST_CLASS') {
      return { hasBagRack: true, hasToilet: true };
    }

    return { hasBagRack: true, hasToilet: false };
  }

  private toSeatRecord(seat: Seat): SeatRecord {
    return {
      id: seat.id,
      coachId: seat.coachId,
      number: seat.number,
      label: seat.label,
      createdAt: seat.createdAt,
    };
  }

  private toTrainRecord(train: Train, stops: TrainStop[]): TrainRecord {
    return {
      id: train.id,
      trainNo: train.trainNo,
      trainName: train.trainName,
      startingCity: train.startingCity,
      endingCity: train.endingCity,
      departureTime: train.departureTime,
      arrivalTime: train.arrivalTime,
      travelTime: train.travelTime,
      description: train.description,
      createdAt: train.createdAt,
      farePerHop: {
        FIRST_CLASS: train.firstClassFarePerHop,
        SECOND_CLASS: train.secondClassFarePerHop,
      },
      routeStops: stops
        .sort((left, right) => left.stopOrder - right.stopOrder)
        .map((stop) => ({
          station: stop.station,
          time: stop.time,
          order: stop.stopOrder,
        })),
    };
  }

  private toFareRecord(fare: Fare): FareRecord {
    return {
      id: fare.id,
      trainId: fare.trainId,
      originStation: fare.originStation,
      destinationStation: fare.destinationStation,
      travelClass: fare.travelClass,
      fare: fare.fare,
      createdAt: fare.createdAt,
    };
  }

  private toBookingRecord(booking: Booking): BookingRecord {
    return {
      id: booking.id,
      bookingCode: booking.bookingCode,
      userId: booking.userId,
      guestKey: booking.guestKey,
      trainId: booking.trainId,
      coachId: booking.coachId,
      seatId: booking.seatId,
      originStationId: booking.originStationId,
      destinationStationId: booking.destinationStationId,
      journeyDate: this.formatDateKey(booking.journeyDate),
      originSequence: booking.originSequence,
      destinationSequence: booking.destinationSequence,
      passengerName: booking.passengerName,
      passengerNic: booking.passengerNic,
      passengerPhone: booking.passengerPhone,
      travelClass: booking.travelClass,
      fare: booking.fare,
      status: booking.status,
      idempotencyKey: booking.idempotencyKey ?? undefined,
      createdAt: booking.createdAt,
      cancelledAt: booking.cancelledAt,
    };
  }

  private toIdempotencyRecord(record: IdempotencyKey): IdempotencyRecord {
    return {
      key: record.key,
      userId: record.userId,
      guestKey: record.guestKey,
      bookingId: record.bookingId,
      responseJson: record.responseJson,
      createdAt: record.createdAt,
    };
  }

  private toJourneyDate(value: string) {
    return new Date(`${value}T00:00:00`);
  }

  private formatDateKey(value: Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private extractBookingSequence(bookingCode: string) {
    const segments = bookingCode.split('-');
    const numericPart = segments[segments.length - 1] ?? '0';
    const parsed = Number.parseInt(numericPart, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  private buildFareRows(
    trainId: string,
    routeStops: Array<{ station: string; time: string }>,
    farePerHop: { FIRST_CLASS: number; SECOND_CLASS: number },
  ) {
    return routeStops.flatMap((originStop, originIndex) =>
      routeStops.flatMap((destinationStop, destinationIndex) => {
        if (destinationIndex <= originIndex) {
          return [];
        }

        return [
          {
            trainId,
            originStation: originStop.station,
            destinationStation: destinationStop.station,
            travelClass: 'FIRST_CLASS' as const,
            fare:
              (destinationIndex - originIndex) * farePerHop.FIRST_CLASS,
          },
          {
            trainId,
            originStation: originStop.station,
            destinationStation: destinationStop.station,
            travelClass: 'SECOND_CLASS' as const,
            fare:
              (destinationIndex - originIndex) * farePerHop.SECOND_CLASS,
          },
        ];
      }),
    );
  }
}
