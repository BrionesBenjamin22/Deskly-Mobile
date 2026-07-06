import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { ApiBadRequestResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { GetAvailableWorkAreasUseCase } from '../../application/use-cases/get-available-work-areas.use-case';
import { ListLocalitiesUseCase } from '../../application/use-cases/list-localities.use-case';
import { ListWorkAreasUseCase } from '../../application/use-cases/list-work-areas.use-case';
import { InvalidReservationDateError } from '../../domain/errors/invalid-reservation-date.error';
import { InvalidTimeFormatError } from '../../domain/errors/invalid-time-format.error';
import { InvalidTimeRangeError } from '../../domain/errors/invalid-time-range.error';
import { GetAvailableDesksQueryDto } from './dto/get-available-desks-query.dto';
import { ListWorkAreasQueryDto } from './dto/list-work-areas-query.dto';

@ApiTags('Work areas')
@Controller()
export class WorkAreasController {
  constructor(
    private readonly listLocalitiesUseCase: ListLocalitiesUseCase,
    private readonly listWorkAreasUseCase: ListWorkAreasUseCase,
    private readonly getAvailableWorkAreasUseCase: GetAvailableWorkAreasUseCase,
  ) {}

  @Get('localities')
  @ApiOkResponse({ description: 'Listado de localidades activas.' })
  listLocalities() {
    return this.listLocalitiesUseCase.execute();
  }

  @Get('work-areas')
  @ApiOkResponse({ description: 'Listado de areas de trabajo activas.' })
  listWorkAreas(@Query() query: ListWorkAreasQueryDto) {
    return this.listWorkAreasUseCase.execute(query);
  }

  @Get('work-areas/availability')
  @ApiOkResponse({
    description: 'Areas con escritorios disponibles para fecha y horario.',
  })
  @ApiBadRequestResponse({ description: 'Parametros invalidos.' })
  async getAvailability(@Query() query: GetAvailableDesksQueryDto) {
    try {
      return await this.getAvailableWorkAreasUseCase.execute(query);
    } catch (error) {
      if (
        error instanceof InvalidReservationDateError ||
        error instanceof InvalidTimeFormatError ||
        error instanceof InvalidTimeRangeError
      ) {
        throw new BadRequestException({
          message: error.message,
          error:
            'Lo sentimos, no pudimos consultar las areas disponibles. Revise los datos ingresados e intente nuevamente.',
        });
      }

      throw error;
    }
  }
}
