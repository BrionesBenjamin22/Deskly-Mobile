import {
  BadRequestException,
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../../../auth/interfaces/http/guards/jwt-auth.guard';
import { GetAvailableDesksUseCase } from '../../application/use-cases/get-available-desks.use-case';
import { InvalidReservationDateError } from '../../domain/errors/invalid-reservation-date.error';
import { InvalidTimeFormatError } from '../../domain/errors/invalid-time-format.error';
import { InvalidTimeRangeError } from '../../domain/errors/invalid-time-range.error';
import { GetAvailableDesksQueryDto } from './dto/get-available-desks-query.dto';

@ApiTags('Desks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('desks')
export class DeskAvailabilityController {
  constructor(
    private readonly getAvailableDesksUseCase: GetAvailableDesksUseCase,
  ) {}

  @Get('availability')
  @ApiOkResponse({
    description: 'Lista de escritorios disponibles para la fecha y horario.',
  })
  @ApiBadRequestResponse({
    description: 'Parametros incompletos o rango horario invalido.',
  })
  async getAvailability(@Query() query: GetAvailableDesksQueryDto) {
    try {
      return await this.getAvailableDesksUseCase.execute(query);
    } catch (error) {
      if (
        error instanceof InvalidReservationDateError ||
        error instanceof InvalidTimeFormatError ||
        error instanceof InvalidTimeRangeError
      ) {
        throw new BadRequestException({
          message: error.message,
          error:
            'Lo sentimos, no pudimos consultar la disponibilidad. Revise los datos ingresados e intente nuevamente.',
        });
      }

      throw error;
    }
  }
}
