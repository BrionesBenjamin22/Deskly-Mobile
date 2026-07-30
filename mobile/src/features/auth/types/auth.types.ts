export type UserRole = 'ADMIN' | 'GESTOR' | 'MIEMBRO';

export type AuthUser = {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  active: boolean;
  member: {
    id: string;
    fullName: string;
    active: boolean;
  } | null;
};

export type LoginPayload = {
  identifier: string;
  password: string;
};

export type LoginResponse = {
  access_token: string;
  refresh_token: string;
  user: AuthUser;
};

export type CurrentUserResponse = {
  user: Omit<AuthUser, 'member'> & {
    blockedUntil: string | null;
    member:
      | (NonNullable<AuthUser['member']> & {
          dni: number;
          phone: number;
        })
      | null;
  };
};

export type RegisterPayload = {
  email: string;
  username: string;
  password: string;
  member?: {
    fullName: string;
    dni: number;
    phone: number;
  };
};

export type RegistrationStatusResponse = {
  requiresMember: boolean;
  registrationAvailable: boolean;
};

export type RegisterResponse = {
  user: AuthUser;
};

export type UpdateProfilePayload = {
  email?: string;
  username?: string;
  fullName?: string;
  phone?: number;
};

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};
