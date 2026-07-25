import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { LocalitiesService } from '../../application/services/localities.service';
import { Roles } from '../../../auth/interfaces/http/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../auth/interfaces/http/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/interfaces/http/guards/roles.guard';
import {
  CreateLocalityBodyDto,
  UpdateLocalityBodyDto,
} from './dto/locality-body.dto';

@ApiTags('Localities')
@Controller('localities')
export class LocalitiesController {
  constructor(private readonly localitiesService: LocalitiesService) {}

  @Get()
  list() {
    return this.localitiesService.list(true);
  }

  @Get(':id')
  find(@Param('id', ParseUUIDPipe) id: string) {
    return this.localitiesService.find(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'GESTOR')
  create(@Body() body: CreateLocalityBodyDto) {
    return this.localitiesService.create(body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'GESTOR')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateLocalityBodyDto,
  ) {
    return this.localitiesService.update(id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'GESTOR')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.localitiesService.remove(id);
  }
}
