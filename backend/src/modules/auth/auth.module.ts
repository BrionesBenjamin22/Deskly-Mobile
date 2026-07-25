import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerGuard } from '@nestjs/throttler';

import { BcryptPasswordHasherService } from './application/services/bcrypt-password-hasher.service';
import { ChangePasswordUseCase } from './application/use-cases/change-password.use-case';
import { GetCurrentUserUseCase } from './application/use-cases/get-current-user.use-case';
import { GetRegistrationStatusUseCase } from './application/use-cases/get-registration-status.use-case';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { RegisterUseCase } from './application/use-cases/register.use-case';
import { UpdateUserRoleUseCase } from './application/use-cases/update-user-role.use-case';
import { UpdateProfileUseCase } from './application/use-cases/update-profile.use-case';
import { ListUsersUseCase } from './application/use-cases/list-users.use-case';
import { DeactivateUserUseCase } from './application/use-cases/deactivate-user.use-case';
import { RestoreUserAccessUseCase } from './application/use-cases/restore-user-access.use-case';
import { AUTH_REPOSITORY } from './domain/ports/auth-repository.port';
import { PASSWORD_HASHER } from './domain/ports/password-hasher.port';
import { PrismaAuthRepository } from './infrastructure/persistence/prisma-auth.repository';
import { AuthController } from './interfaces/http/auth.controller';
import { JwtAuthGuard } from './interfaces/http/guards/jwt-auth.guard';
import { RolesGuard } from './interfaces/http/guards/roles.guard';
import { UsersController } from './interfaces/http/users.controller';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
      }),
    }),
  ],
  controllers: [AuthController, UsersController],
  providers: [
    RegisterUseCase,
    LoginUseCase,
    ChangePasswordUseCase,
    GetCurrentUserUseCase,
    GetRegistrationStatusUseCase,
    UpdateUserRoleUseCase,
    UpdateProfileUseCase,
    ListUsersUseCase,
    DeactivateUserUseCase,
    RestoreUserAccessUseCase,
    JwtAuthGuard,
    RolesGuard,
    ThrottlerGuard,
    { provide: AUTH_REPOSITORY, useClass: PrismaAuthRepository },
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasherService },
  ],
  exports: [JwtModule, JwtAuthGuard, RolesGuard, AUTH_REPOSITORY],
})
export class AuthModule {}
