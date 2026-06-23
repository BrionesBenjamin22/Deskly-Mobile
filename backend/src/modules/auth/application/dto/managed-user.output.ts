import { User } from '../../domain/entities/user.entity';

export function toManagedUserOutput(user: User) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    active: user.active,
    blockedUntil: user.blockedUntil?.toISOString() ?? null,
    member: user.member
      ? {
          id: user.member.id,
          fullName: user.member.fullName,
          active: user.member.active,
        }
      : null,
    createdAt: user.createdAt?.toISOString(),
    updatedAt: user.updatedAt?.toISOString(),
  };
}
