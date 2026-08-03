import { Controller, Get, Param, Query } from '@nestjs/common';
import { TrainService } from './train.service';

@Controller('trains')
export class TrainController {
  constructor(private readonly trainService: TrainService) {}

  @Get()
  findAll(
    @Query('from') originStation?: string,
    @Query('to') destinationStation?: string,
  ) {
    return this.trainService.findAll({ originStation, destinationStation });
  }

  @Get(':trainNo')
  findOne(@Param('trainNo') trainNo: string) {
    return this.trainService.findOne(trainNo);
  }

  @Get(':trainNo/fares')
  getFares(@Param('trainNo') trainNo: string) {
    return this.trainService.getFares(trainNo);
  }
}
