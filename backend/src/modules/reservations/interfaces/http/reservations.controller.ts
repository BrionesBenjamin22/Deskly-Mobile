import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  ForbiddenException,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiTags,
  ApiOkResponse,
} from '@nestjs/swagger';

import { DeskNotFoundError } from '../../../desks/domain/errors/desk-not-found.error';
import { LocalityInactiveError } from '../../../desks/domain/errors/locality-inactive.error';
import { WorkAreaInactiveError } from '../../../desks/domain/errors/work-area-inactive.error';
import type { AuthenticatedRequest } from '../../../auth/interfaces/http/auth-request';
import { JwtAuthGuard } from '../../../auth/interfaces/http/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/interfaces/http/guards/roles.guard';
import { Roles } from '../../../auth/interfaces/http/decorators/roles.decorator';
import { InvalidReservationDateError } from '../../../desks/domain/errors/invalid-reservation-date.error';
import { InvalidTimeFormatError } from '../../../desks/domain/errors/invalid-time-format.error';
import { InvalidTimeRangeError } from '../../../desks/domain/errors/invalid-time-range.error';
import { CancelReservationUseCase } from '../../application/use-cases/cancel-reservation.use-case';
import { CreateReservationUseCase } from '../../application/use-cases/create-reservation.use-case';
import { GetReservationByIdUseCase } from '../../application/use-cases/get-reservation-by-id.use-case';
import { ListReservationsUseCase } from '../../application/use-cases/list-reservations.use-case';
import { UpdateReservationUseCase } from '../../application/use-cases/update-reservation.use-case';
import { ValidateArrivalUseCase } from '../../application/use-cases/validate-arrival.use-case';
import { DeskUnavailableError } from '../../domain/errors/desk-unavailable.error';
import { MemberNotFoundError } from '../../domain/errors/member-not-found.error';
import { ReservationCannotBeCancelledError } from '../../domain/errors/reservation-cannot-be-cancelled.error';
import { ReservationCannotBeUpdatedError } from '../../domain/errors/reservation-cannot-be-updated.error';
import { ReservationCannotCheckInError } from '../../domain/errors/reservation-cannot-check-in.error';
import { ReservationNotFoundError } from '../../domain/errors/reservation-not-found.error';
import { CancelReservationResponseDto } from './dto/cancel-reservation-response.dto';
import { CreateReservationBodyDto } from './dto/create-reservation-body.dto';
import { ListReservationsQueryDto } from './dto/list-reservations-query.dto';
import { ReservationResponseDto } from './dto/reservation-response.dto';
import { UpdateReservationBodyDto } from './dto/update-reservation-body.dto';

@ApiTags('Reservations')
@Controller('reservations')
export class ReservationsController {
  constructor(
    private readonly createReservationUseCase: CreateReservationUseCase,
    private readonly listReservationsUseCase: ListReservationsUseCase,
    private readonly getReservationByIdUseCase: GetReservationByIdUseCase,
    private readonly updateReservationUseCase: UpdateReservationUseCase,
    private readonly cancelReservationUseCase: CancelReservationUseCase,
    private readonly validateArrivalUseCase: ValidateArrivalUseCase,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MIEMBRO')
  @ApiCreatedResponse({
    description: 'Reserva creada correctamente.',
    type: ReservationResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Datos invalidos.' })
  @ApiNotFoundResponse({ description: 'Escritorio no encontrado.' })
  @ApiConflictResponse({ description: 'Escritorio no disponible.' })
  async create(
    @Body() body: CreateReservationBodyDto,
    @Req() request: AuthenticatedRequest,
  ) {
    try {
      if (!request.user.member) throw new MemberNotFoundError();
      return await this.createReservationUseCase.execute({
        ...body,
        memberId: request.user.member.id,
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOkResponse({ description: 'Listado paginado de reservas.' })
  async list(
    @Query() query: ListReservationsQueryDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.listReservationsUseCase.execute({
      ...query,
      ...(request.user.role === 'MIEMBRO' && request.user.member
        ? { memberId: request.user.member.id }
        : {}),
    });
  }

  @Get(':id')
  @ApiOkResponse({
    description: 'Detalle de la reserva.',
    type: ReservationResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Reserva no encontrada.' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    try {
      return await this.getReservationByIdUseCase.execute(id);
    } catch (error) {
      this.handleError(error);
    }
  }

  @Patch(':id')
  @ApiOkResponse({
    description: 'Reserva actualizada correctamente.',
    type: ReservationResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Datos invalidos.' })
  @ApiConflictResponse({
    description: 'Reserva no editable o escritorio no disponible.',
  })
  @ApiNotFoundResponse({ description: 'Reserva o escritorio no encontrado.' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateReservationBodyDto,
  ) {
    try {
      return await this.updateReservationUseCase.execute({ id, ...body });
    } catch (error) {
      this.handleError(error);
    }
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOkResponse({
    description: 'Reserva cancelada correctamente.',
    type: CancelReservationResponseDto,
  })
  @ApiConflictResponse({ description: 'La reserva no esta activa.' })
  @ApiNotFoundResponse({ description: 'Reserva no encontrada.' })
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: AuthenticatedRequest,
  ) {
    try {
      const reservation = await this.getReservationByIdUseCase.execute(id);
      if (
        request.user.role === 'MIEMBRO' &&
        request.user.member?.id !== reservation.memberId
      ) {
        throw new ForbiddenException({
          message: 'No puede cancelar una reserva de otro miembro.',
          error:
            'Lo sentimos, seleccione una reserva propia e intente nuevamente.',
        });
      }
      return await this.cancelReservationUseCase.execute(id);
    } catch (error) {
      this.handleError(error);
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(204)
  @ApiNoContentResponse({
    description: 'Reserva cancelada logicamente.',
  })
  @ApiConflictResponse({ description: 'La reserva no esta activa.' })
  @ApiNotFoundResponse({ description: 'Reserva no encontrada.' })
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<void> {
    try {
      const reservation = await this.getReservationByIdUseCase.execute(id);
      if (
        request.user.role === 'MIEMBRO' &&
        request.user.member?.id !== reservation.memberId
      ) {
        throw new ForbiddenException({
          message: 'No puede cancelar una reserva de otro miembro.',
          error:
            'Lo sentimos, seleccione una reserva propia e intente nuevamente.',
        });
      }
      await this.cancelReservationUseCase.execute(id);
    } catch (error) {
      this.handleError(error);
    }
  }

  @Patch(':id/check-in')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('GESTOR')
  @ApiOkResponse({
    description: 'Llegada validada correctamente.',
    type: ReservationResponseDto,
  })
  async validateArrival(@Param('id', ParseUUIDPipe) id: string) {
    try {
      return await this.validateArrivalUseCase.execute(id);
    } catch (error) {
      this.handleError(error);
    }
  }

  private handleError(error: unknown): never {
    if (error instanceof DeskNotFoundError) {
      throw new NotFoundException({
        message: error.message,
        error:
          'Lo sentimos, no pudimos recuperar la informacion del escritorio. Intente nuevamente.',
      });
    }

    if (error instanceof ReservationNotFoundError) {
      throw new NotFoundException({
        message: error.message,
        error:
          'Lo sentimos, no pudimos recuperar la informacion de la reserva. Intente nuevamente.',
      });
    }

    if (error instanceof MemberNotFoundError) {
      throw new NotFoundException({
        message: error.message,
        error:
          'Lo sentimos, no pudimos recuperar la informacion del miembro. Verifique el miembro e intente nuevamente.',
      });
    }

    if (error instanceof DeskUnavailableError) {
      throw new ConflictException({
        error: 'Desk unavailable',
        message:
          'El escritorio ya no esta disponible. Seleccione otro escritorio.',
      });
    }

    if (error instanceof WorkAreaInactiveError) {
      throw new ConflictException({
        message: error.message,
        error:
          'Lo sentimos, el area de trabajo del escritorio no esta disponible. Seleccione otro escritorio e intente nuevamente.',
      });
    }

    if (error instanceof LocalityInactiveError) {
      throw new ConflictException({
        message: error.message,
        error:
          'Lo sentimos, la localidad del area de trabajo no esta disponible. Seleccione otro escritorio e intente nuevamente.',
      });
    }

    if (
      error instanceof ReservationCannotBeCancelledError ||
      error instanceof ReservationCannotBeUpdatedError
    ) {
      throw new ConflictException({
        message: error.message,
        error:
          'Lo sentimos, no pudimos modificar la reserva porque ya no se encuentra activa.',
      });
    }

    if (error instanceof ReservationCannotCheckInError) {
      throw new ConflictException({
        message: error.message,
        error:
          'Lo sentimos, solo puede validar la llegada de una reserva activa del dia actual.',
      });
    }

    if (
      error instanceof InvalidReservationDateError ||
      error instanceof InvalidTimeFormatError ||
      error instanceof InvalidTimeRangeError
    ) {
      throw new BadRequestException({
        message: error.message,
        error:
          'Lo sentimos, no pudimos crear la reserva. Revise los datos ingresados e intente nuevamente.',
      });
    }

    throw error;
  }
}
