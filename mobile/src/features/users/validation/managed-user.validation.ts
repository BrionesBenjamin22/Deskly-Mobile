import { UserRole } from '../../auth/types/auth.types';

export function hasRoleChanged(currentRole: UserRole, nextRole: UserRole) {
  return currentRole !== nextRole;
}
