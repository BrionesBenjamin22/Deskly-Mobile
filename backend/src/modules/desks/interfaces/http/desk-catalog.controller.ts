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
  UseGuards,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';

import { CreateAmenityUseCase } from '../../application/use-cases/create-amenity.use-case';
import { CreateDeskDescriptionUseCase } from '../../application/use-cases/create-desk-description.use-case';
import { DeleteAmenityUseCase } from '../../application/use-cases/delete-amenity.use-case';
import { DeleteDeskDescriptionUseCase } from '../../application/use-cases/delete-desk-description.use-case';
import { GetAmenityByIdUseCase } from '../../application/use-cases/get-amenity-by-id.use-case';
import { GetDeskDescriptionByIdUseCase } from '../../application/use-cases/get-desk-description-by-id.use-case';
import { ListAmenitiesUseCase } from '../../application/use-cases/list-amenities.use-case';
import { ListDeskDescriptionsUseCase } from '../../application/use-cases/list-desk-descriptions.use-case';
import { UpdateAmenityUseCase } from '../../application/use-cases/update-amenity.use-case';
import { UpdateDeskDescriptionUseCase } from '../../application/use-cases/update-desk-description.use-case';
import { DeskCatalogItemInUseError } from '../../domain/errors/desk-catalog-item-in-use.error';
import { DeskCatalogItemNotFoundError } from '../../domain/errors/desk-catalog-item-not-found.error';
import { CreateAmenityBodyDto } from './dto/create-amenity-body.dto';
import { CreateDeskDescriptionBodyDto } from './dto/create-desk-description-body.dto';
import { UpdateAmenityBodyDto } from './dto/update-amenity-body.dto';
import { UpdateDeskDescriptionBodyDto } from './dto/update-desk-description-body.dto';
import { Roles } from '../../../auth/interfaces/http/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../auth/interfaces/http/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/interfaces/http/guards/roles.guard';

@ApiTags('Desk catalog')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class DeskCatalogController {
  constructor(
    private readonly createDeskDescriptionUseCase: CreateDeskDescriptionUseCase,
    private readonly listDeskDescriptionsUseCase: ListDeskDescriptionsUseCase,
    private readonly getDeskDescriptionByIdUseCase: GetDeskDescriptionByIdUseCase,
    private readonly updateDeskDescriptionUseCase: UpdateDeskDescriptionUseCase,
    private readonly deleteDeskDescriptionUseCase: DeleteDeskDescriptionUseCase,
    private readonly createAmenityUseCase: CreateAmenityUseCase,
    private readonly listAmenitiesUseCase: ListAmenitiesUseCase,
    private readonly getAmenityByIdUseCase: GetAmenityByIdUseCase,
    private readonly updateAmenityUseCase: UpdateAmenityUseCase,
    private readonly deleteAmenityUseCase: DeleteAmenityUseCase,
  ) {}

  @Get('desk-descriptions')
  @ApiOkResponse({ description: 'Listado de descripciones reutilizables.' })
  listDescriptions() {
    return this.listDeskDescriptionsUseCase.execute();
  }

  @Post('desk-descriptions')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'GESTOR')
  @ApiCreatedResponse({ description: 'Descripcion creada correctamente.' })
  createDescription(@Body() body: CreateDeskDescriptionBodyDto) {
    return this.createDeskDescriptionUseCase.execute(body);
  }

  @Get('desk-descriptions/:id')
  @ApiOkResponse({ description: 'Detalle de descripcion reutilizable.' })
  @ApiNotFoundResponse({ description: 'Descripcion no encontrada.' })
  async getDescription(@Param('id', ParseUUIDPipe) id: string) {
    try {
      return await this.getDeskDescriptionByIdUseCase.execute(id);
    } catch (error) {
      this.handleError(error);
    }
  }

  @Patch('desk-descriptions/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'GESTOR')
  @ApiOkResponse({ description: 'Descripcion actualizada correctamente.' })
  @ApiNotFoundResponse({ description: 'Descripcion no encontrada.' })
  async updateDescription(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateDeskDescriptionBodyDto,
  ) {
    try {
      return await this.updateDeskDescriptionUseCase.execute({ id, ...body });
    } catch (error) {
      this.handleError(error);
    }
  }

  @Delete('desk-descriptions/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'GESTOR')
  @HttpCode(204)
  @ApiNoContentResponse({ description: 'Descripcion eliminada correctamente.' })
  @ApiNotFoundResponse({ description: 'Descripcion no encontrada.' })
  @ApiConflictResponse({ description: 'Descripcion asociada a escritorios.' })
  async deleteDescription(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    try {
      await this.deleteDeskDescriptionUseCase.execute(id);
    } catch (error) {
      this.handleError(error);
    }
  }

  @Get('amenities')
  @ApiOkResponse({ description: 'Listado de amenities.' })
  listAmenities() {
    return this.listAmenitiesUseCase.execute();
  }

  @Post('amenities')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'GESTOR')
  @ApiCreatedResponse({ description: 'Amenities creado correctamente.' })
  createAmenity(@Body() body: CreateAmenityBodyDto) {
    return this.createAmenityUseCase.execute(body);
  }

  @Get('amenities/:id')
  @ApiOkResponse({ description: 'Detalle de amenities.' })
  @ApiNotFoundResponse({ description: 'Amenities no encontrado.' })
  async getAmenity(@Param('id', ParseUUIDPipe) id: string) {
    try {
      return await this.getAmenityByIdUseCase.execute(id);
    } catch (error) {
      this.handleError(error);
    }
  }

  @Patch('amenities/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'GESTOR')
  @ApiOkResponse({ description: 'Amenities actualizado correctamente.' })
  @ApiNotFoundResponse({ description: 'Amenities no encontrado.' })
  async updateAmenity(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateAmenityBodyDto,
  ) {
    try {
      return await this.updateAmenityUseCase.execute({ id, ...body });
    } catch (error) {
      this.handleError(error);
    }
  }

  @Delete('amenities/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'GESTOR')
  @HttpCode(204)
  @ApiNoContentResponse({ description: 'Amenities eliminado correctamente.' })
  @ApiNotFoundResponse({ description: 'Amenities no encontrado.' })
  @ApiConflictResponse({ description: 'Amenities asociado a escritorios.' })
  async deleteAmenity(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    try {
      await this.deleteAmenityUseCase.execute(id);
    } catch (error) {
      this.handleError(error);
    }
  }

  private handleError(error: unknown): never {
    if (error instanceof DeskCatalogItemNotFoundError) {
      throw new NotFoundException({
        message: error.message,
        error:
          'Lo sentimos, no pudimos recuperar la informacion del catalogo. Intente nuevamente.',
      });
    }

    if (error instanceof DeskCatalogItemInUseError) {
      throw new ConflictException({
        message: error.message,
        error:
          'Lo sentimos, no pudimos eliminar el elemento porque esta asociado a uno o mas escritorios.',
      });
    }

    throw error;
  }
}
