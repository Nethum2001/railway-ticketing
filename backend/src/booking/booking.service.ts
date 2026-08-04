import {
  BadRequestException,
  ConflictException,
  Injectable,
  HttpException,
  HttpStatus,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  CLASS_MULTIPLIERS,
  normalizeJourneyClass,
} from '../common/railway.constants';
import { NotificationService } from '../notification/notification.service';
import { RailwayStoreService } from '../railway-store/railway-store.service';
import { AuthenticatedUser } from '../railway-store/railway-store.types';

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);

  constructor(
    private readonly store: RailwayStoreService,
    private readonly notificationService: NotificationService,
  ) {}

  async createBooking(
    user: AuthenticatedUser | undefined,
    input: {
      trainNo?: string;
      coachCode: string;
      seatNumber: string;
      originStation: string;
      destinationStation: string;
      journeyDate: string;
      passengerName: string;
      passengerNic: string;
      passengerPhone: string;
      travelClass: 'FIRST_CLASS' | 'SECOND_CLASS' | 'THIRD_CLASS';
      idempotencyKey?: string;
      holdToken?: string;
    },
  ) {
    const bookingOwnerKey =
      user?.sub ??
      `guest:${input.passengerNic.toLowerCase().replace(/\s+/g, '-')}`;
    const bookingActor = user?.email ?? input.passengerNic;
    const bookingUserId = user?.sub;
    const guestKey = user ? undefined : bookingOwnerKey;
    const holdOwnerKey = input.holdToken?.trim() || bookingOwnerKey;

    this.logger.log(`Booking started for ${bookingActor}`);

    const existingResponse = input.idempotencyKey
      ? this.store.findBookingByIdempotencyKey(input.idempotencyKey)
      : undefined;
    if (existingResponse) {
      return JSON.parse(existingResponse.responseJson) as ReturnType<
        BookingService['toBookingResponse']
      >;
    }

    if (!this.store.recordBookingAttempt(bookingOwnerKey)) {
      throw new HttpException(
        'Too many booking attempts. Please wait a minute and retry.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const coach = this.store.getCoachByCode(input.coachCode);
    const train = input.trainNo?.trim()
      ? this.store.getTrainByNumber(input.trainNo.trim())
      : undefined;
    const origin = this.store.getStationByName(input.originStation);
    const destination = this.store.getStationByName(input.destinationStation);
    const seat = this.store.getSeatByCoachAndNumber(
      input.coachCode,
      input.seatNumber,
    );

    if (input.trainNo && !train) {
      throw new NotFoundException('Train not found');
    }

    if (!coach || !origin || !destination || !seat) {
      throw new NotFoundException('Coach, station, or seat not found');
    }

    if (origin.sequence >= destination.sequence) {
      throw new BadRequestException(
        'Destination must be after the origin station',
      );
    }

    const normalizedClass = normalizeJourneyClass(input.travelClass);

    const booking = await this.store.withSeatLock(
      input.coachCode,
      input.seatNumber,
      async () => {
        const bookedSeatNumbers = this.store.getBookedSeatNumbers({
          coachCode: input.coachCode,
          originStation: input.originStation,
          destinationStation: input.destinationStation,
          journeyDate: input.journeyDate,
          holderKey: holdOwnerKey,
        });

        if (bookedSeatNumbers.includes(input.seatNumber)) {
          this.logger.warn(
            `Overlap detected for seat ${input.seatNumber} on ${input.journeyDate}`,
          );
          throw new ConflictException(
            'Seat already booked for the selected segment',
          );
        }

        const fareDistance = destination.sequence - origin.sequence;
        const fare = Math.max(
          1,
          Math.round(
            fareDistance *
              coach.baseFare *
              (CLASS_MULTIPLIERS[normalizedClass] ?? 1),
          ),
        );

        const bookingRecord = await this.store.createBooking({
          userId: bookingUserId,
          guestKey,
          trainId: train?.id ?? null,
          coachId: coach.id,
          seatId: seat.id,
          originStationId: origin.id,
          destinationStationId: destination.id,
          journeyDate: input.journeyDate,
          originSequence: origin.sequence,
          destinationSequence: destination.sequence,
          passengerName: input.passengerName,
          passengerNic: input.passengerNic,
          passengerPhone: input.passengerPhone,
          travelClass: normalizedClass as
            'FIRST_CLASS' | 'SECOND_CLASS' | 'THIRD_CLASS',
          fare,
          idempotencyKey: input.idempotencyKey,
        });

        const response = this.toBookingResponse(
          bookingRecord,
          coach.code,
          seat.number,
          origin.name,
          destination.name,
        );

        if (input.idempotencyKey) {
          await this.store.saveIdempotencyRecord({
            key: input.idempotencyKey,
            userId: bookingUserId,
            guestKey,
            bookingId: bookingRecord.id,
            responseJson: JSON.stringify(response),
            createdAt: new Date(),
          });
        }

        if (user?.email) {
          await this.notificationService.notifyBookingCreated({
            bookingCode: bookingRecord.bookingCode,
            email: user.email,
            passengerName: input.passengerName,
          });
        }

        this.store.releaseSeatHold({
          holderKey: holdOwnerKey,
          coachCode: input.coachCode,
          seatNumber: input.seatNumber,
          journeyDate: input.journeyDate,
          originStation: input.originStation,
          destinationStation: input.destinationStation,
        });

        return response;
      },
    );

    this.logger.log(
      `Booking success for ${bookingActor} -> ${booking.bookingCode}`,
    );
    return booking;
  }

  getBookingsForUser(user: AuthenticatedUser) {
    return this.store
      .getBookingsByUser(user.sub)
      .map((booking) =>
        this.toBookingResponse(
          booking,
          this.getCoachCodeForBooking(booking.coachId),
          this.store.getSeatById(booking.seatId)?.number ?? booking.seatId,
          this.store.getStationById(booking.originStationId)?.name ??
            booking.originStationId,
          this.store.getStationById(booking.destinationStationId)?.name ??
            booking.destinationStationId,
        ),
      );
  }

  async cancelBooking(user: AuthenticatedUser, bookingId: string) {
    const cancelled = await this.store.cancelBooking(bookingId, user.sub);

    if (!cancelled) {
      throw new NotFoundException('Booking not found');
    }

    return this.toBookingResponse(
      cancelled,
      this.getCoachCodeForBooking(cancelled.coachId),
      this.store.getSeatById(cancelled.seatId)?.number ?? cancelled.seatId,
      this.store.getStationById(cancelled.originStationId)?.name ??
        cancelled.originStationId,
      this.store.getStationById(cancelled.destinationStationId)?.name ??
        cancelled.destinationStationId,
    );
  }

  private getCoachCodeForBooking(coachId: string) {
    return (
      this.store.getCoaches().find((coach) => coach.id === coachId)?.code ??
      coachId
    );
  }

  private toBookingResponse(
    booking: {
      id: string;
      bookingCode: string;
      coachId: string;
      seatId: string;
      originStationId: string;
      destinationStationId: string;
      journeyDate: string;
      passengerName: string;
      passengerNic: string;
      passengerPhone: string;
      travelClass: string;
      fare: number;
      status: string;
      createdAt: Date;
      cancelledAt?: Date | null;
    },
    coachCode: string,
    seatNumber: string,
    originStation: string,
    destinationStation: string,
  ) {
    return {
      id: booking.id,
      bookingCode: booking.bookingCode,
      coachCode,
      seatNumber,
      originStation,
      destinationStation,
      journeyDate: booking.journeyDate,
      passengerName: booking.passengerName,
      passengerNic: booking.passengerNic,
      passengerPhone: booking.passengerPhone,
      travelClass: booking.travelClass,
      fare: booking.fare,
      status: booking.status,
      createdAt: booking.createdAt,
      cancelledAt: booking.cancelledAt ?? null,
    };
  }
}
