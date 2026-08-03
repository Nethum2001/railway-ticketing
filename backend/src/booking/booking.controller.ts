import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@Controller('bookings')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post()
  createBooking(@CurrentUser() user: any, @Body() body: CreateBookingDto) {
    return this.bookingService.createBooking(user, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  findMyBookings(@CurrentUser() user: any) {
    return this.bookingService.getBookingsForUser(user);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  cancelBooking(@CurrentUser() user: any, @Param('id') bookingId: string) {
    return this.bookingService.cancelBooking(user, bookingId);
  }
}
