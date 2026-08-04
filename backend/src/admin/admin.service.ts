import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthenticatedUser } from '../railway-store/railway-store.types';
import { RailwayStoreService } from '../railway-store/railway-store.service';

type AnalyticsPeriod = 'daily' | 'weekly' | 'monthly';

@Injectable()
export class AdminService {
  constructor(private readonly store: RailwayStoreService) {}

  private static readonly REQUIRED_COACH_CODES = ['R1', 'R2', 'R3'] as const;

  getAdmins() {
    return this.store.getUsersByRole('ADMIN').map((user) => ({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      createdAt: user.createdAt,
    }));
  }

  async promoteToAdmin(email: string) {
    const updated = await this.store.setUserRoleByEmail(email, 'ADMIN');

    if (!updated) {
      throw new NotFoundException('User not found for the provided email');
    }

    return {
      id: updated.id,
      email: updated.email,
      fullName: updated.fullName,
      role: updated.role,
    };
  }

  async removeAdmin(userId: string, currentUser: AuthenticatedUser) {
    if (userId === currentUser.sub) {
      throw new BadRequestException('You cannot remove your own admin role');
    }

    const admins = this.store.getUsersByRole('ADMIN');
    if (admins.length <= 1) {
      throw new ConflictException('At least one admin account must remain');
    }

    const targetAdmin = admins.find((admin) => admin.id === userId);
    if (!targetAdmin) {
      throw new NotFoundException('Admin user not found');
    }

    const updated = await this.store.setUserRoleById(userId, 'CUSTOMER');

    if (!updated) {
      throw new NotFoundException('Admin user not found');
    }

    return {
      id: updated.id,
      email: updated.email,
      fullName: updated.fullName,
      role: updated.role,
    };
  }

  getOverview(period: AnalyticsPeriod = 'weekly') {
    const bookings = this.store
      .getAllBookings()
      .filter((booking) => booking.status === 'CONFIRMED');
    const trains = this.store.getTrains();
    const coaches = this.store.getCoaches();

    const buckets = this.buildBuckets(period);
    const bucketMap = new Map(
      buckets.map((bucket) => [
        bucket.key,
        { key: bucket.key, label: bucket.label, revenue: 0, bookings: 0 },
      ]),
    );

    for (const booking of bookings) {
      const bookingDate = new Date(`${booking.journeyDate}T00:00:00`);
      const key = this.toBucketKey(period, bookingDate);
      const bucket = bucketMap.get(key);

      if (!bucket) {
        continue;
      }

      bucket.revenue += booking.fare;
      bucket.bookings += 1;
    }

    const totalSeats = coaches.length * 52;
    const trainCount = Math.max(1, trains.length);

    const points = buckets.map((bucket) => {
      const value = bucketMap.get(bucket.key) ?? {
        key: bucket.key,
        label: bucket.label,
        revenue: 0,
        bookings: 0,
      };
      const capacity = Math.max(1, bucket.capacityDays * totalSeats * trainCount);
      const occupancy = Math.min(100, Number(((value.bookings / capacity) * 100).toFixed(2)));

      return {
        key: value.key,
        label: value.label,
        revenue: value.revenue,
        bookings: value.bookings,
        occupancy,
      };
    });

    const totalRevenue = points.reduce((sum, point) => sum + point.revenue, 0);
    const totalBookings = points.reduce((sum, point) => sum + point.bookings, 0);
    const totalCapacity = points.reduce(
      (sum, point) =>
        sum +
        Math.max(1, this.capacityDaysForPoint(period, point.key) * totalSeats * trainCount),
      0,
    );
    const occupancyRate = Math.min(
      100,
      Number(((totalBookings / Math.max(1, totalCapacity)) * 100).toFixed(2)),
    );

    return {
      period,
      points,
      totals: {
        revenue: totalRevenue,
        bookings: totalBookings,
        occupancyRate,
        activeTrains: trains.length,
        activeCoaches: coaches.length,
      },
    };
  }

  getCoachStatus(trainNo: string, journeyDate?: string) {
    const train = this.ensureTrainCoachTopology(trainNo);

    const dateKey = journeyDate ?? new Date().toISOString().slice(0, 10);
    const bookings = this.store
      .getAllBookings()
      .filter(
        (booking) =>
          booking.status === 'CONFIRMED' &&
          booking.journeyDate === dateKey &&
          booking.trainId === train.id,
      );

    return this.store.getCoaches().map((coach) => {
      const bookedSeats = new Set(
        bookings
          .filter((booking) => booking.coachId === coach.id)
          .map((booking) => booking.seatId),
      );

      const bookedSeatCount = bookedSeats.size;
      const totalSeatCount = 52;
      const occupancyRate = Number(
        ((bookedSeatCount / totalSeatCount) * 100).toFixed(2),
      );

      return {
        trainNo,
        coachCode: coach.code,
        coachName: coach.name,
        travelClass: coach.travelClass,
        bookedSeatCount,
        totalSeatCount,
        occupancyRate,
        hasBagRack: coach.hasBagRack,
        hasToilet: coach.hasToilet,
      };
    });
  }

  async createTrain(input: {
    trainNo: string;
    trainName: string;
    startingCity: string;
    endingCity: string;
    departureTime: string;
    arrivalTime: string;
    travelTime: string;
    description: string;
    farePerHop: { FIRST_CLASS: number; SECOND_CLASS: number };
    routeStops: Array<{ station: string; time: string }>;
  }) {
    const created = await this.store.createTrain(input);
    if (!created) {
      throw new ConflictException('Train number already exists');
    }

    return created;
  }

  async updateTrain(
    trainNo: string,
    input: Partial<{
      trainName: string;
      startingCity: string;
      endingCity: string;
      departureTime: string;
      arrivalTime: string;
      travelTime: string;
      description: string;
      farePerHop: { FIRST_CLASS: number; SECOND_CLASS: number };
      routeStops: Array<{ station: string; time: string }>;
    }>,
  ) {
    const updated = await this.store.updateTrain(trainNo, input);
    if (!updated) {
      throw new NotFoundException('Train not found');
    }

    return updated;
  }

  async removeTrain(trainNo: string) {
    const removed = await this.store.removeTrain(trainNo);
    if (!removed) {
      throw new NotFoundException('Train not found');
    }

    return { success: true };
  }

  async createCoach(input: {
    code: string;
    name: string;
    description: string;
    baseFare: number;
    travelClass: 'FIRST_CLASS' | 'SECOND_CLASS';
    hasBagRack?: boolean;
    hasToilet?: boolean;
  }) {
    throw new ConflictException(
      'Each train must operate with exactly 3 coaches (R1, R2, R3). Creating additional coaches is disabled.',
    );
  }

  async updateCoachAmenities(
    trainNo: string,
    coachCode: string,
    input: { hasBagRack?: boolean; hasToilet?: boolean },
  ) {
    this.ensureTrainCoachTopology(trainNo);

    const updated = await this.store.updateCoachAmenities(coachCode, input);
    if (!updated) {
      throw new NotFoundException('Coach not found');
    }

    return {
      trainNo,
      ...updated,
    };
  }

  async removeCoach(trainNo: string, coachCode: string) {
    this.ensureTrainCoachTopology(trainNo);

    const coach = this.store.getCoachByCode(coachCode);
    if (!coach) {
      throw new NotFoundException('Coach not found');
    }

    throw new ConflictException(
      'Each train must operate with exactly 3 coaches (R1, R2, R3). Removing coaches is disabled.',
    );
  }

  private ensureTrainCoachTopology(trainNo: string) {
    const train = this.store.getTrainByNumber(trainNo);
    if (!train) {
      throw new NotFoundException('Train not found');
    }

    const coaches = this.store.getCoaches();
    const coachCodes = new Set(coaches.map((coach) => coach.code));

    const hasRequiredCoaches = AdminService.REQUIRED_COACH_CODES.every((code) =>
      coachCodes.has(code),
    );

    if (!hasRequiredCoaches || coaches.length !== 3) {
      throw new ConflictException(
        'Invalid coach topology detected. Each train must have exactly 3 coaches: R1, R2, and R3.',
      );
    }

    return train;
  }

  private buildBuckets(period: AnalyticsPeriod) {
    const today = new Date();

    if (period === 'daily') {
      return Array.from({ length: 14 }, (_, index) => {
        const date = new Date(today);
        date.setDate(today.getDate() - (13 - index));
        return {
          key: this.dateKey(date),
          label: date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
          }),
          capacityDays: 1,
        };
      });
    }

    if (period === 'weekly') {
      const currentMonday = this.startOfWeek(today);
      return Array.from({ length: 12 }, (_, index) => {
        const start = new Date(currentMonday);
        start.setDate(currentMonday.getDate() - (11 - index) * 7);
        return {
          key: this.dateKey(start),
          label: `${start.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
          })}`,
          capacityDays: 7,
        };
      });
    }

    return Array.from({ length: 12 }, (_, index) => {
      const date = new Date(today.getFullYear(), today.getMonth() - (11 - index), 1);
      return {
        key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        label: date.toLocaleDateString('en-GB', {
          month: 'short',
          year: '2-digit',
        }),
        capacityDays: this.daysInMonth(date),
      };
    });
  }

  private toBucketKey(period: AnalyticsPeriod, date: Date) {
    if (period === 'daily') {
      return this.dateKey(date);
    }

    if (period === 'weekly') {
      return this.dateKey(this.startOfWeek(date));
    }

    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  private dateKey(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private startOfWeek(date: Date) {
    const day = date.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(date);
    monday.setDate(date.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  }

  private daysInMonth(date: Date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  }

  private capacityDaysForPoint(period: AnalyticsPeriod, key: string) {
    if (period === 'monthly') {
      const [year, month] = key.split('-').map((value) => Number.parseInt(value, 10));
      return this.daysInMonth(new Date(year, (month || 1) - 1, 1));
    }

    if (period === 'weekly') {
      return 7;
    }

    return 1;
  }
}
