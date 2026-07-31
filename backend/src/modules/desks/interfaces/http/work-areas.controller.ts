import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';

import { GetAvailableWorkAreasUseCase } from '../../application/use-cases/get-available-work-areas.use-case';
import { WorkAreasService } from '../../application/services/work-areas.service';
import { InvalidReservationDateError } from '../../domain/errors/invalid-reservation-date.error';
import { InvalidTimeFormatError } from '../../domain/errors/invalid-time-format.error';
import { InvalidTimeRangeError } from '../../domain/errors/invalid-time-range.error';
import { GetAvailableDesksQueryDto } from './dto/get-available-desks-query.dto';
import { ListWorkAreasQueryDto } from './dto/list-work-areas-query.dto';
import {
  CreateWorkAreaBodyDto,
  UpdateWorkAreaBodyDto,
} from './dto/work-area-body.dto';
import { Roles } from '../../../auth/interfaces/http/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../auth/interfaces/http/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/interfaces/http/guards/roles.guard';

@ApiTags('Work areas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class WorkAreasController {
  constructor(
    private readonly workAreasService: WorkAreasService,
    private readonly getAvailableWorkAreasUseCase: GetAvailableWorkAreasUseCase,
  ) {}

  @Get('work-areas')
  @ApiOkResponse({ description: 'Listado de areas de trabajo activas.' })
  listWorkAreas(@Query() query: ListWorkAreasQueryDto) {
    return this.workAreasService.list(query.localityId, true);
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

  @Get('work-areas/:id')
  find(@Param('id', ParseUUIDPipe) id: string) {
    return this.workAreasService.find(id);
  }

  @Post('work-areas')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'GESTOR')
  create(@Body() body: CreateWorkAreaBodyDto) {
    return this.workAreasService.create(body);
  }

  @Patch('work-areas/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'GESTOR')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateWorkAreaBodyDto,
  ) {
    return this.workAreasService.update(id, body);
  }

  @Delete('work-areas/:id')
  @HttpCode(204)
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'GESTOR')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.workAreasService.remove(id);
  }
}
