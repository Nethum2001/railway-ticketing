import { Injectable } from '@nestjs/common';
import { RailwayStoreService } from '../railway-store/railway-store.service';

@Injectable()
export class CoachService {
  constructor(private readonly store: RailwayStoreService) {}

  findAll() {
    return this.store.getCoaches().map((coach) => ({
      id: coach.id,
      code: coach.code,
      name: coach.name,
      description: coach.description,
      baseFare: coach.baseFare,
      travelClass: coach.travelClass,
    }));
  }
}
