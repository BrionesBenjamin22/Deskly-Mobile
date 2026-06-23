import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  NotFoundException,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';

import type { AuthenticatedRequest } from '../../../auth/interfaces/http/auth-request';
import { Roles } from '../../../auth/interfaces/http/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../auth/interfaces/http/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/interfaces/http/guards/roles.guard';
import { PenaltyRegistrationService } from '../../application/services/penalty-registration.service';
import { ListPenaltiesUseCase } from '../../application/use-cases/list-penalties.use-case';
import {
  AbsenceToleranceNotReachedError,
  PenaltyAlreadyExistsError,
  PenaltyReservationNotFoundError,
  ReservationNotActiveForAbsenceError,
  ReservationAlreadyCheckedInError,
} from '../../domain/errors/penalty.errors';
import { ListPenaltiesQueryDto } from './dto/list-penalties-query.dto';
import { RegisterAbsenceBodyDto } from './dto/register-absence-body.dto';

@ApiTags('Penalties')
@ApiBearerAuth()
@Controller('penalties')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PenaltiesController {
  constructor(
    private readonly registrationService: PenaltyRegistrationService,
    private readonly listPenaltiesUseCase: ListPenaltiesUseCase,
  ) {}

  @Post('absence')
  @Roles('GESTOR')
  @ApiCreatedResponse({
    description: 'Reserva cancelada e infraccion registrada.',
  })
  async registerAbsence(
    @Body() body: RegisterAbsenceBodyDto,
    @Req() request: AuthenticatedRequest,
  ) {
    try {
      const penalty = await this.registrationService.registerAbsence({
        ...body,
        registeredById: request.user.id,
      });
      return {
        penaltyId: penalty.id,
        reservationId: penalty.reservationId,
        memberId: penalty.memberId,
        registeredById: penalty.registeredById,
        type: penalty.type,
        level: penalty.level,
        reason: penalty.reason,
        registeredAt: penalty.registeredAt.toISOString(),
        activeUntil: penalty.activeUntil.toISOString(),
        active: penalty.active,
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  @Get()
  @ApiOkResponse({ description: 'Listado paginado de infracciones.' })
  list(
    @Query() query: ListPenaltiesQueryDto,
    @Req() request: AuthenticatedRequest,
  ) {
    const memberId =
      request.user.role === 'MIEMBRO'
        ? request.user.member?.id
        : query.memberId;
    return this.listPenaltiesUseCase.execute({
      page: query.page,
      limit: query.limit,
      ...(memberId ? { memberId } : {}),
    });
  }

  private handleError(error: unknown): never {
    if (error instanceof PenaltyReservationNotFoundError) {
      throw new NotFoundException({
        message: error.message,
        error:
          'Lo sentimos, no pudimos recuperar la reserva. Verifique los datos e intente nuevamente.',
      });
    }
    if (error instanceof AbsenceToleranceNotReachedError) {
      throw new BadRequestException({
        message: error.message,
        error:
          'La hora de tolerancia aun no finalizo. Intente nuevamente mas tarde.',
      });
    }
    if (
      error instanceof PenaltyAlreadyExistsError ||
      error instanceof ReservationNotActiveForAbsenceError ||
      error instanceof ReservationAlreadyCheckedInError
    ) {
      throw new ConflictException({
        message: error.message,
        error:
          'Lo sentimos, la reserva ya fue procesada o no se encuentra activa.',
      });
    }
    throw error;
  }
}
