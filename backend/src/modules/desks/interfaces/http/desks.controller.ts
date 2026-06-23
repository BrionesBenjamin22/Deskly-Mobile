import {
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
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';

import { CreateDeskUseCase } from '../../application/use-cases/create-desk.use-case';
import { DeleteDeskUseCase } from '../../application/use-cases/delete-desk.use-case';
import { GetDeskByIdUseCase } from '../../application/use-cases/get-desk-by-id.use-case';
import { ListDesksUseCase } from '../../application/use-cases/list-desks.use-case';
import { UpdateDeskUseCase } from '../../application/use-cases/update-desk.use-case';
import { DeskNameAlreadyExistsError } from '../../domain/errors/desk-name-already-exists.error';
import { DeskNotFoundError } from '../../domain/errors/desk-not-found.error';
import { CreateDeskBodyDto } from './dto/create-desk-body.dto';
import { DeskResponseDto } from './dto/desk-response.dto';
import { ListDesksQueryDto } from './dto/list-desks-query.dto';
import { UpdateDeskBodyDto } from './dto/update-desk-body.dto';

@ApiTags('Desks')
@Controller('desks')
export class DesksController {
  constructor(
    private readonly createDeskUseCase: CreateDeskUseCase,
    private readonly listDesksUseCase: ListDesksUseCase,
    private readonly getDeskByIdUseCase: GetDeskByIdUseCase,
    private readonly updateDeskUseCase: UpdateDeskUseCase,
    private readonly deleteDeskUseCase: DeleteDeskUseCase,
  ) {}

  @Post()
  @ApiCreatedResponse({
    description: 'Escritorio creado correctamente.',
    type: DeskResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Datos invalidos.' })
  async create(@Body() body: CreateDeskBodyDto) {
    try {
      return await this.createDeskUseCase.execute(body);
    } catch (error) {
      this.handleError(error);
    }
  }

  @Get()
  @ApiOkResponse({ description: 'Listado paginado de escritorios.' })
  async list(@Query() query: ListDesksQueryDto) {
    return this.listDesksUseCase.execute(query);
  }

  @Get(':id')
  @ApiOkResponse({
    description: 'Detalle del escritorio.',
    type: DeskResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Escritorio no encontrado.' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    try {
      return await this.getDeskByIdUseCase.execute(id);
    } catch (error) {
      this.handleError(error);
    }
  }

  @Patch(':id')
  @ApiOkResponse({
    description: 'Escritorio actualizado correctamente.',
    type: DeskResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Datos invalidos.' })
  @ApiNotFoundResponse({ description: 'Escritorio no encontrado.' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateDeskBodyDto,
  ) {
    try {
      return await this.updateDeskUseCase.execute({
        id,
        ...body,
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiNoContentResponse({ description: 'Escritorio eliminado logicamente.' })
  @ApiNotFoundResponse({ description: 'Escritorio no encontrado.' })
  async delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    try {
      await this.deleteDeskUseCase.execute(id);
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

    if (error instanceof DeskNameAlreadyExistsError) {
      throw new ConflictException({
        message: error.message,
        error: 'Ya existe un escritorio con ese nombre.',
      });
    }

    throw error;
  }
}
