import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  HttpCode,
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

import { GetCurrentUserUseCase } from '../../application/use-cases/get-current-user.use-case';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { RegisterUseCase } from '../../application/use-cases/register.use-case';
import {
  InactiveUserError,
  InvalidCredentialsError,
  MemberDataRequiredError,
  UserAlreadyExistsError,
} from '../../domain/errors/auth.errors';
import type { AuthenticatedRequest } from './auth-request';
import { LoginBodyDto } from './dto/login-body.dto';
import { RegisterBodyDto } from './dto/register-body.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly getCurrentUserUseCase: GetCurrentUserUseCase,
  ) {}

  @Post('register')
  @ApiCreatedResponse({ description: 'Usuario registrado correctamente.' })
  @ApiBadRequestResponse({ description: 'Datos de registro invalidos o incompletos.' })
  @ApiConflictResponse({ description: 'Email o nombre de usuario ya registrado.' })
  async register(@Body() body: RegisterBodyDto) {
    try {
      return await this.registerUseCase.execute(body);
    } catch (error) {
      if (error instanceof MemberDataRequiredError) {
        throw new BadRequestException({
          message: 'Los datos del miembro son obligatorios.',
          error: 'Lo sentimos, complete los datos del miembro e intente nuevamente.',
        });
      }
      if (error instanceof UserAlreadyExistsError) {
        throw new ConflictException({
          message: 'El email o nombre de usuario ya se encuentra registrado.',
          error: 'Lo sentimos, utilice otros datos e intente nuevamente.',
        });
      }
      throw error;
    }
  }

  @Post('login')
  @HttpCode(200)
  @ApiOkResponse({ description: 'Sesion iniciada correctamente.' })
  @ApiUnauthorizedResponse({ description: 'Credenciales invalidas o usuario inactivo.' })
  async login(@Body() body: LoginBodyDto) {
    try {
      return await this.loginUseCase.execute(body);
    } catch (error) {
      if (error instanceof InvalidCredentialsError || error instanceof InactiveUserError) {
        throw new UnauthorizedException({
          message: 'No fue posible iniciar sesion con las credenciales proporcionadas.',
          error: 'Lo sentimos, revise sus credenciales e intente nuevamente.',
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
}
