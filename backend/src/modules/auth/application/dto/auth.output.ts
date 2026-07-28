import { User, UserRoleValue } from '../../domain/entities/user.entity';

export type PublicUserOutput = {
  id: string;
  email: string;
  username: string;
  role: UserRoleValue;
  active: boolean;
  member: {
    id: string;
    fullName: string;
    active: boolean;
  } | null;
};

export type CurrentUserOutput = Omit<PublicUserOutput, 'member'> & {
  blockedUntil: string | null;
  member: {
    id: string;
    fullName: string;
    dni: number;
    phone: number;
    active: boolean;
  } | null;
};

export function toPublicUser(user: User): PublicUserOutput {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    active: user.active,
    member: user.member
      ? {
          id: user.member.id,
          fullName: user.member.fullName,
          active: user.member.active,
        }
      : null,
  };
}

export function toCurrentUser(user: User): CurrentUserOutput {
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
          dni: user.member.dni,
          phone: user.member.phone,
          active: user.member.active,
        }
      : null,
  };
}
