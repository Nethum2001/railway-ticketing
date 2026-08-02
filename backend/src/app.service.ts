import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello() {
    return {
      service: 'RailVista API',
      status: 'ok',
      timestamp: new Date().toISOString(),
      endpoints: [
        '/auth/register',
        '/auth/login',
        '/stations',
        '/coaches',
        '/seats/availability',
        '/bookings',
      ],
    };
  }
}
