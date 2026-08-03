import { Injectable, NotFoundException } from '@nestjs/common';
import { RailwayStoreService } from '../railway-store/railway-store.service';

@Injectable()
export class SeatService {
  constructor(private readonly store: RailwayStoreService) {}

  getAvailability(input: {
    coachCode: string;
    originStation: string;
    destinationStation: string;
    journeyDate: string;
    holderKey?: string;
  }) {
    const coach = this.store.getCoachByCode(input.coachCode);
    const origin = this.store.getStationByName(input.originStation);
    const destination = this.store.getStationByName(input.destinationStation);

    if (!coach || !origin || !destination) {
      throw new NotFoundException('Coach or station not found');
    }

    const bookedSeatNumbers = new Set(
      this.store.getBookedSeatNumbers({
        coachCode: input.coachCode,
        originStation: input.originStation,
        destinationStation: input.destinationStation,
        journeyDate: input.journeyDate,
        holderKey: input.holderKey,
      }),
    );

    const seats = Array.from({ length: 52 }, (_, index) =>
      String(index + 1),
    ).map((seatNumber) => ({
      seatNumber,
      status: bookedSeatNumbers.has(seatNumber) ? 'booked' : 'available',
    }));

    return {
      coach: {
        code: coach.code,
        name: coach.name,
        description: coach.description,
      },
      journey: {
        originStation: origin.name,
        destinationStation: destination.name,
        journeyDate: input.journeyDate,
      },
      seats,
    };
  }

  holdSeats(input: {
    holderKey: string;
    coachCode: string;
    seatNumbers: string[];
    originStation: string;
    destinationStation: string;
    journeyDate: string;
  }) {
    return this.store.holdSeats(input);
  }
}
