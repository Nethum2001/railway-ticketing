import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Queue, Worker } from 'bullmq';

@Injectable()
export class NotificationService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationService.name);
  private queue?: Queue;
  private worker?: Worker;

  onModuleInit() {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
      this.logger.log('REDIS_URL not configured, booking notifications will be logged inline');
      return;
    }

    this.queue = new Queue('booking-email', {
      connection: { url: redisUrl },
    });

    this.worker = new Worker(
      'booking-email',
      async (job) => {
        this.logger.log(`Queued notification for ${job.data.bookingCode} to ${job.data.email}`);
      },
      { connection: { url: redisUrl } },
    );
  }

  async notifyBookingCreated(payload: { bookingCode: string; email: string; passengerName: string }) {
    if (!this.queue) {
      this.logger.log(`Booking confirmed for ${payload.passengerName} (${payload.email}) -> ${payload.bookingCode}`);
      return;
    }

    await this.queue.add('booking-created', payload, {
      removeOnComplete: true,
      removeOnFail: 50,
    });
  }

  async onModuleDestroy() {
    await this.worker?.close();
    await this.queue?.close();
  }
}