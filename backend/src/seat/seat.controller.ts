import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { SeatService } from './seat.service';
import { HoldSeatsDto } from './dto/hold-seats.dto';

@Controller('seats')
export class SeatController {
  constructor(private readonly seatService: SeatService) {}

  @Get('availability')
  getAvailability(
    @Query('coachCode') coachCode: string,
    @Query('originStation') originStation: string,
    @Query('destinationStation') destinationStation: string,
    @Query('journeyDate') journeyDate: string,
    @Query('holderKey') holderKey?: string,
  ) {
    return this.seatService.getAvailability({
      coachCode,
      originStation,
      destinationStation,
      journeyDate,
      holderKey,
    });
  }

  @Post('hold')
  holdSeats(@Body() body: HoldSeatsDto) {
    return this.seatService.holdSeats(body);
  }
}
