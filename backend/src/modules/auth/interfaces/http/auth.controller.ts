import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

import { ChangePasswordUseCase } from '../../application/use-cases/change-password.use-case';
import { GetCurrentUserUseCase } from '../../application/use-cases/get-current-user.use-case';
import { GetRegistrationStatusUseCase } from '../../application/use-cases/get-registration-status.use-case';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { RegisterUseCase } from '../../application/use-cases/register.use-case';
import { UpdateProfileUseCase } from '../../application/use-cases/update-profile.use-case';
import {
  BlockedUserError,
  InactiveUserError,
  InvalidCredentialsError,
  InvalidCurrentPasswordError,
  MemberDataRequiredError,
  UserAlreadyExistsError,
  UserNotFoundError,
} from '../../domain/errors/auth.errors';
import type { AuthenticatedRequest } from './auth-request';
import { ChangePasswordBodyDto } from './dto/change-password-body.dto';
import { LoginBodyDto } from './dto/login-body.dto';
import { RegisterBodyDto } from './dto/register-body.dto';
import { UpdateProfileBodyDto } from './dto/update-profile-body.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly getCurrentUserUseCase: GetCurrentUserUseCase,
    private readonly getRegistrationStatusUseCase: GetRegistrationStatusUseCase,
    private readonly updateProfileUseCase: UpdateProfileUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
  ) {}

  @Get('registration-status')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOkResponse({
    description: 'Indica si los proximos registros requieren datos de miembro.',
  })
  getRegistrationStatus() {
    return this.getRegistrationStatusUseCase.execute();
  }

  @Post('register')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiCreatedResponse({ description: 'Usuario registrado correctamente.' })
  @ApiBadRequestResponse({
    description: 'Datos de registro invalidos o incompletos.',
  })
  @ApiConflictResponse({
    description: 'Email o nombre de usuario ya registrado.',
  })
  async register(@Body() body: RegisterBodyDto) {
    try {
      return await this.registerUseCase.execute(body);
    } catch (error) {
      if (error instanceof MemberDataRequiredError) {
        throw new BadRequestException({
          message: 'Los datos del miembro son obligatorios.',
          error:
            'Lo sentimos, complete los datos del miembro e intente nuevamente.',
        });
      }
      if (error instanceof UserAlreadyExistsError) {
        throw new ConflictException({
          message:
            'El email, nombre de usuario o DNI ya se encuentra registrado.',
          error: 'Lo sentimos, utilice otros datos e intente nuevamente.',
        });
      }
      throw error;
    }
  }

  @Post('login')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(200)
  @ApiOkResponse({ description: 'Sesion iniciada correctamente.' })
  @ApiUnauthorizedResponse({
    description: 'Credenciales invalidas o usuario inactivo.',
  })
  async login(@Body() body: LoginBodyDto) {
    try {
      return await this.loginUseCase.execute(body);
    } catch (error) {
      if (error instanceof InvalidCredentialsError) {
        throw new UnauthorizedException({
          message: 'Credenciales incorrectas.',
          error: 'Lo sentimos, revise sus credenciales e intente nuevamente.',
        });
      }
      if (error instanceof InactiveUserError) {
        throw new UnauthorizedException({
          message: 'Su cuenta se encuentra desactivada.',
          error: 'Su cuenta fue desactivada por un administrador. Contacte al administrador para restaurar el acceso.',
          errorCode: 'ACCOUNT_INACTIVE',
        });
      }
      if (error instanceof BlockedUserError) {
        const date = error.blockedUntil.toLocaleDateString('es-AR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
        throw new UnauthorizedException({
          message: 'Su cuenta se encuentra bloqueada.',
          error: `Su acceso fue restringido hasta el ${date}. Puede contactar a un administrador para solicitar el desbloqueo anticipado.`,
          blockedUntil: error.blockedUntil.toISOString(),
        });
      }
      throw error;
    }
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Usuario autenticado.' })
  @ApiUnauthorizedResponse({ description: 'Sesion invalida o expirada.' })
  getCurrentUser(@Req() request: AuthenticatedRequest) {
    return this.getCurrentUserUseCase.execute(request.user.id);
  }

  @Patch('me/password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOkResponse({ description: 'Contraseña actualizada correctamente.' })
  @ApiBadRequestResponse({ description: 'Datos invalidos o incompletos.' })
  @ApiUnauthorizedResponse({ description: 'Contraseña actual incorrecta o sesion invalida.' })
  async changePassword(
    @Req() request: AuthenticatedRequest,
    @Body() body: ChangePasswordBodyDto,
  ) {
    try {
      await this.changePasswordUseCase.execute({
        userId: request.user.id,
        currentPassword: body.currentPassword,
        newPassword: body.newPassword,
      });
      return { message: 'Contraseña actualizada correctamente.' };
    } catch (error) {
      if (error instanceof InvalidCurrentPasswordError) {
        throw new UnauthorizedException({
          message: 'La contraseña actual es incorrecta.',
          error: 'Lo sentimos, la contraseña actual no coincide. Intente nuevamente.',
        });
      }
      if (error instanceof UserNotFoundError) {
        throw new NotFoundException({
          message: 'Usuario no encontrado.',
          error: 'Lo sentimos, no pudimos encontrar su cuenta.',
        });
      }
      throw error;
    }
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOkResponse({ description: 'Perfil actualizado correctamente.' })
  @ApiBadRequestResponse({ description: 'Datos invalidos o incompletos.' })
  @ApiConflictResponse({ description: 'Email o nombre de usuario ya registrado.' })
  @ApiUnauthorizedResponse({ description: 'Sesion invalida o expirada.' })
  async updateProfile(
    @Req() request: AuthenticatedRequest,
    @Body() body: UpdateProfileBodyDto,
  ) {
    try {
      return await this.updateProfileUseCase.execute({
        userId: request.user.id,
        email: body.email?.trim().toLowerCase(),
        username: body.username?.trim().toLowerCase(),
        fullName: body.fullName?.trim(),
        phone: body.phone,
      });
    } catch (error) {
      if (error instanceof UserAlreadyExistsError) {
        throw new ConflictException({
          message: 'El email o nombre de usuario ya se encuentra registrado.',
          error: 'Lo sentimos, utilice otros datos e intente nuevamente.',
        });
      }
      if (error instanceof UserNotFoundError) {
        throw new NotFoundException({
          message: 'Usuario no encontrado.',
          error: 'Lo sentimos, no pudimos encontrar su cuenta.',
        });
      }
      throw error;
    }
  }
}
