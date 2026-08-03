import { Injectable, NotFoundException } from '@nestjs/common';
import { RailwayStoreService } from '../railway-store/railway-store.service';

@Injectable()
export class TrainService {
  constructor(private readonly store: RailwayStoreService) {}

  findAll(input?: { originStation?: string; destinationStation?: string }) {
    const trains = this.store.getTrains();

    return trains
      .filter((train) => {
        if (!input?.originStation || !input?.destinationStation) {
          return true;
        }

        const originIndex = train.routeStops.findIndex(
          (stop) => stop.station === input.originStation,
        );
        const destinationIndex = train.routeStops.findIndex(
          (stop) => stop.station === input.destinationStation,
        );
        return originIndex >= 0 && destinationIndex > originIndex;
      })
      .map((train) => ({
        trainNo: train.trainNo,
        trainName: train.trainName,
        startingCity: train.startingCity,
        endingCity: train.endingCity,
        departureTime: train.departureTime,
        arrivalTime: train.arrivalTime,
        travelTime: train.travelTime,
        description: train.description,
        routeStops: train.routeStops,
        farePerHop: train.farePerHop,
      }));
  }

  findOne(trainNo: string) {
    const train = this.store.getTrainByNumber(trainNo);

    if (!train) {
      throw new NotFoundException('Train not found');
    }

    return {
      trainNo: train.trainNo,
      trainName: train.trainName,
      startingCity: train.startingCity,
      endingCity: train.endingCity,
      departureTime: train.departureTime,
      arrivalTime: train.arrivalTime,
      travelTime: train.travelTime,
      description: train.description,
      routeStops: train.routeStops,
      farePerHop: train.farePerHop,
    };
  }

  getFares(trainNo: string) {
    const fares = this.store.getFaresByTrainNumber(trainNo);

    if (fares.length === 0) {
      throw new NotFoundException('Fare table not found');
    }

    return fares.map((fare) => ({
      travelClass: fare.travelClass,
      originStation: fare.originStation,
      destinationStation: fare.destinationStation,
      fare: fare.fare,
    }));
  }
}
