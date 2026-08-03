import { Injectable } from '@nestjs/common';
import { RailwayStoreService } from '../railway-store/railway-store.service';

@Injectable()
export class StationService {
  constructor(private readonly store: RailwayStoreService) {}

  findAll() {
    return this.store.getStations().map((station) => ({
      id: station.id,
      name: station.name,
      sequence: station.sequence,
    }));
  }
}
