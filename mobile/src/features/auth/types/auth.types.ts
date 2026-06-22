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
  user: AuthUser;
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
};

export type RegisterResponse = {
  user: AuthUser;
};
