import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { BookingModule } from './booking/booking.module';
import { CoachModule } from './coach/coach.module';
import { NotificationModule } from './notification/notification.module';
import { RailwayStoreModule } from './railway-store/railway-store.module';
import { SeatModule } from './seat/seat.module';
import { StationModule } from './station/station.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 100,
      },
    ]),
    RailwayStoreModule,
    AuthModule,
    StationModule,
    CoachModule,
    SeatModule,
    NotificationModule,
    BookingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
