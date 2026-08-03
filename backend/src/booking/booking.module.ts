import { Module } from '@nestjs/common';
import { RailwayStoreModule } from '../railway-store/railway-store.module';
import { NotificationModule } from '../notification/notification.module';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';

@Module({
  imports: [RailwayStoreModule, NotificationModule],
  controllers: [BookingController],
  providers: [BookingService],
  exports: [BookingService],
})
export class BookingModule {}
