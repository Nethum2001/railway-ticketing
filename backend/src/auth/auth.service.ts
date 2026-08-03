import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { RailwayStoreService } from '../railway-store/railway-store.service';
import {
  AuthenticatedUser,
  UserRecord,
} from '../railway-store/railway-store.types';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly store: RailwayStoreService,
    private readonly jwtService: JwtService,
  ) {}

  async register(input: {
    email: string;
    password: string;
    fullName: string;
    role?: 'CUSTOMER' | 'ADMIN';
  }) {
    const existingUser = this.store.findUserByEmail(input.email);

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await hash(input.password, 10);
    const user = await this.store.createUser({
      email: input.email,
      passwordHash,
      fullName: input.fullName,
      role: input.role,
    });

    if (!user) {
      throw new ConflictException('Email already registered');
    }

    this.logger.log(`Registered new user ${user.email}`);
    return this.createSession(user);
  }

  async login(input: { email: string; password: string }) {
    const user = this.store.findUserByEmail(input.email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await compare(input.password, user.passwordHash);

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.createSession(user);
  }

  async me(user: AuthenticatedUser) {
    const record = this.store.findUserById(user.sub);

    if (!record) {
      throw new UnauthorizedException('User not found');
    }

    return this.toUserResponse(record);
  }

  private createSession(user: UserRecord) {
    const payload: AuthenticatedUser = {
      sub: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET ?? 'railvista-dev-secret',
      expiresIn: (process.env.JWT_EXPIRES_IN ?? '8h') as never,
    });

    return {
      accessToken,
      tokenType: 'Bearer',
      user: this.toUserResponse(user),
    };
  }

  private toUserResponse(user: UserRecord) {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      createdAt: user.createdAt,
    };
  }
}
