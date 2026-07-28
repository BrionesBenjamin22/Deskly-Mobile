import { IsIn } from 'class-validator';
import { USER_ROLES } from '../../../domain/entities/user.entity';
import type { UserRoleValue } from '../../../domain/entities/user.entity';

export class UpdateRoleBodyDto {
  @IsIn(USER_ROLES)
  role!: UserRoleValue;
}
