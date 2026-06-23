import {
  Controller,
  ForbiddenException,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Body,
  Delete,
  Get,
  Query,
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
import { ListUsersUseCase } from '../../application/use-cases/list-users.use-case';
import { DeactivateUserUseCase } from '../../application/use-cases/deactivate-user.use-case';
import {
  LastActiveAdminError,
  SelfDeactivationForbiddenError,
  SelfRoleChangeForbiddenError,
  UserAlreadyInactiveError,
  UserNotFoundError,
} from '../../domain/errors/auth.errors';
import type { AuthenticatedRequest } from './auth-request';
import { Roles } from './decorators/roles.decorator';
import { UpdateRoleBodyDto } from './dto/update-role-body.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(
    private readonly updateUserRoleUseCase: UpdateUserRoleUseCase,
    private readonly listUsersUseCase: ListUsersUseCase,
    private readonly deactivateUserUseCase: DeactivateUserUseCase,
  ) {}

  @Get()
  @Roles('ADMIN')
  @ApiOkResponse({ description: 'Listado paginado de usuarios.' })
  list(@Query() query: ListUsersQueryDto) {
    return this.listUsersUseCase.execute(query);
  }

  @Patch(':id/role')
  @Roles('ADMIN')
  @ApiOkResponse({ description: 'Rol actualizado correctamente.' })
  @ApiUnauthorizedResponse({ description: 'Sesion invalida o expirada.' })
  @ApiForbiddenResponse({
    description: 'Solo un administrador puede cambiar roles.',
  })
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
      if (error instanceof LastActiveAdminError) {
        throw new ForbiddenException({
          message: 'Debe existir al menos un administrador activo.',
          error:
            'Lo sentimos, asigne otro administrador antes de modificar este usuario.',
        });
      }
      throw error;
    }
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOkResponse({ description: 'Usuario desactivado logicamente.' })
  async deactivate(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: AuthenticatedRequest,
  ) {
    try {
      return await this.deactivateUserUseCase.execute({
        userId: id,
        actorId: request.user.id,
      });
    } catch (error) {
      if (error instanceof SelfDeactivationForbiddenError) {
        throw new ForbiddenException({
          message: 'No puede desactivar su propia cuenta.',
          error: 'Lo sentimos, solicite la baja a otro administrador.',
        });
      }
      if (error instanceof LastActiveAdminError) {
        throw new ForbiddenException({
          message: 'Debe existir al menos un administrador activo.',
          error:
            'Lo sentimos, asigne otro administrador antes de desactivar este usuario.',
        });
      }
      if (error instanceof UserAlreadyInactiveError) {
        throw new ForbiddenException({
          message: 'El usuario ya se encuentra inactivo.',
          error: 'Lo sentimos, actualice el listado e intente nuevamente.',
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
