import { Module } from '@nestjs/common';
import { RailwayStoreModule } from '../railway-store/railway-store.module';
import { CoachController } from './coach.controller';
import { CoachService } from './coach.service';

@Module({
  imports: [RailwayStoreModule],
  controllers: [CoachController],
  providers: [CoachService],
  exports: [CoachService],
})
export class CoachModule {}