import { Module } from '@nestjs/common';
import { RailwayStoreService } from './railway-store.service';

@Module({
  providers: [RailwayStoreService],
  exports: [RailwayStoreService],
})
export class RailwayStoreModule {}