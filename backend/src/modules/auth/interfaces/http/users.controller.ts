import {
  Controller,
  ForbiddenException,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { UpdateUserRoleUseCase } from '../../application/use-cases/update-user-role.use-case';
import { SelfRoleChangeForbiddenError, UserNotFoundError } from '../../domain/errors/auth.errors';
import type { AuthenticatedRequest } from './auth-request';
import { Roles } from './decorators/roles.decorator';
import { UpdateRoleBodyDto } from './dto/update-role-body.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly updateUserRoleUseCase: UpdateUserRoleUseCase) {}

  @Patch(':id/role')
  @Roles('ADMIN')
  @ApiOkResponse({ description: 'Rol actualizado correctamente.' })
  @ApiUnauthorizedResponse({ description: 'Sesion invalida o expirada.' })
  @ApiForbiddenResponse({ description: 'Solo un administrador puede cambiar roles.' })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado.' })
  async updateRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateRoleBodyDto,
    @Req() request: AuthenticatedRequest,
  ) {
    try {
      return await this.updateUserRoleUseCase.execute({
        userId: id,
        role: body.role,
        actorId: request.user.id,
      });
    } catch (error) {
      if (error instanceof SelfRoleChangeForbiddenError) {
        throw new ForbiddenException({
          message: 'No puede modificar su propio rol.',
          error: 'Lo sentimos, solicite el cambio a otro administrador.',
        });
      }
      if (error instanceof UserNotFoundError) {
        throw new NotFoundException({
          message: 'Usuario no encontrado.',
          error: 'Lo sentimos, verifique el usuario e intente nuevamente.',
        });
      }
      throw error;
    }
  }
}
