import { Module } from '@nestjs/common';
import { RailwayStoreModule } from '../railway-store/railway-store.module';
import { TrainController } from './train.controller';
import { TrainService } from './train.service';

@Module({
  imports: [RailwayStoreModule],
  controllers: [TrainController],
  providers: [TrainService],
  exports: [TrainService],
})
export class TrainModule {}
