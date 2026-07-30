import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { JwtSignOptions } from '@nestjs/jwt';

import { User } from '../../domain/entities/user.entity';
import {
  BlockedUserError,
  InactiveUserError,
  InvalidRefreshTokenError,
} from '../../domain/errors/auth.errors';
import {
  AUTH_REPOSITORY,
  type AuthRepositoryPort,
} from '../../domain/ports/auth-repository.port';
import { toPublicUser } from '../dto/auth.output';

type RefreshTokenPayload = {
  sub?: string;
  tokenVersion?: number;
  tokenType?: string;
};

@Injectable()
export class SessionTokenService {
  constructor(
    @Inject(AUTH_REPOSITORY) private readonly repository: AuthRepositoryPort,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async issue(user: User) {
    const accessToken = await this.jwtService.signAsync(
      {
        email: user.email,
        username: user.username,
        role: user.role,
        active: user.active,
        tokenVersion: user.tokenVersion,
      },
      {
        subject: user.id,
        expiresIn: this.configService.getOrThrow<string>(
          'JWT_EXPIRES_IN',
        ) as JwtSignOptions['expiresIn'],
      },
    );
    const refreshToken = await this.jwtService.signAsync(
      {
        tokenType: 'refresh',
        tokenVersion: user.tokenVersion,
      },
      {
        subject: user.id,
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.getOrThrow<string>(
          'JWT_REFRESH_EXPIRES_IN',
        ) as JwtSignOptions['expiresIn'],
      },
    );

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: toPublicUser(user),
    };
  }

  async refresh(refreshToken: string) {
    let payload: RefreshTokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(
        refreshToken,
        {
          secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        },
      );
    } catch {
      throw new InvalidRefreshTokenError();
    }

    if (!payload.sub || payload.tokenType !== 'refresh') {
      throw new InvalidRefreshTokenError();
    }

    const user = await this.repository.findById(payload.sub);
    if (!user || payload.tokenVersion !== user.tokenVersion) {
      throw new InvalidRefreshTokenError();
    }
    if (!user.active || user.member?.active === false) {
      throw new InactiveUserError();
    }
    if (user.blockedUntil && user.blockedUntil.getTime() > Date.now()) {
      throw new BlockedUserError(user.blockedUntil);
    }

    return this.issue(user);
  }
}
