import { Module } from '@nestjs/common';
import { RailwayStoreModule } from '../railway-store/railway-store.module';
import { SeatController } from './seat.controller';
import { SeatService } from './seat.service';

@Module({
  imports: [RailwayStoreModule],
  controllers: [SeatController],
  providers: [SeatService],
  exports: [SeatService],
})
export class SeatModule {}