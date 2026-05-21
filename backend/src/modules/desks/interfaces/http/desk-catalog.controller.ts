import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { CreateAmenityUseCase } from '../../application/use-cases/create-amenity.use-case';
import { CreateDeskDescriptionUseCase } from '../../application/use-cases/create-desk-description.use-case';
import { ListAmenitiesUseCase } from '../../application/use-cases/list-amenities.use-case';
import { ListDeskDescriptionsUseCase } from '../../application/use-cases/list-desk-descriptions.use-case';
import { CreateAmenityBodyDto } from './dto/create-amenity-body.dto';
import { CreateDeskDescriptionBodyDto } from './dto/create-desk-description-body.dto';

@ApiTags('Desk catalog')
@Controller()
export class DeskCatalogController {
  constructor(
    private readonly createDeskDescriptionUseCase: CreateDeskDescriptionUseCase,
    private readonly listDeskDescriptionsUseCase: ListDeskDescriptionsUseCase,
    private readonly createAmenityUseCase: CreateAmenityUseCase,
    private readonly listAmenitiesUseCase: ListAmenitiesUseCase,
  ) {}

  @Get('desk-descriptions')
  @ApiOkResponse({ description: 'Listado de descripciones reutilizables.' })
  listDescriptions() {
    return this.listDeskDescriptionsUseCase.execute();
  }

  @Post('desk-descriptions')
  @ApiCreatedResponse({ description: 'Descripcion creada correctamente.' })
  createDescription(@Body() body: CreateDeskDescriptionBodyDto) {
    return this.createDeskDescriptionUseCase.execute(body);
  }

  @Get('amenities')
  @ApiOkResponse({ description: 'Listado de amenities.' })
  listAmenities() {
    return this.listAmenitiesUseCase.execute();
  }

  @Post('amenities')
  @ApiCreatedResponse({ description: 'Amenity creado correctamente.' })
  createAmenity(@Body() body: CreateAmenityBodyDto) {
    return this.createAmenityUseCase.execute(body);
  }
}
