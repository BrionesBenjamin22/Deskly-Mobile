import { SetMetadata } from '@nestjs/common';
import { UserRoleValue } from '../../../domain/entities/user.entity';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRoleValue[]) =>
  SetMetadata(ROLES_KEY, roles);
