import { Module } from '@nestjs/common';
import { RailwayStoreModule } from '../railway-store/railway-store.module';
import { StationController } from './station.controller';
import { StationService } from './station.service';

@Module({
  imports: [RailwayStoreModule],
  controllers: [StationController],
  providers: [StationService],
  exports: [StationService],
})
export class StationModule {}
