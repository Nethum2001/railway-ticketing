import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { RailwayStoreModule } from '../railway-store/railway-store.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [
    RailwayStoreModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'railvista-dev-secret',
      signOptions: { expiresIn: (process.env.JWT_EXPIRES_IN ?? '8h') as never },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
