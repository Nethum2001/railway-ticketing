import { Module } from '@nestjs/common';
import { RailwayStoreModule } from '../railway-store/railway-store.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [RailwayStoreModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
