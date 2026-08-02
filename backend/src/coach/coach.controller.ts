import { Controller, Get } from '@nestjs/common';
import { CoachService } from './coach.service';

@Controller('coaches')
export class CoachController {
  constructor(private readonly coachService: CoachService) {}

  @Get()
  findAll() {
    return this.coachService.findAll();
  }
}