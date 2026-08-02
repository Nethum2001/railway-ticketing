import { Controller, Get, Query } from '@nestjs/common';
import { SeatService } from './seat.service';

@Controller('seats')
export class SeatController {
  constructor(private readonly seatService: SeatService) {}

  @Get('availability')
  getAvailability(
    @Query('coachCode') coachCode: string,
    @Query('originStation') originStation: string,
    @Query('destinationStation') destinationStation: string,
    @Query('journeyDate') journeyDate: string,
  ) {
    return this.seatService.getAvailability({
      coachCode,
      originStation,
      destinationStation,
      journeyDate,
    });
  }
}