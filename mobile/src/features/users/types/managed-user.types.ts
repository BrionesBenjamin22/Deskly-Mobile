import { UserRole } from '../../auth/types/auth.types';

export type ManagedUser = {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  active: boolean;
  blockedUntil: string | null;
  member: {
    id: string;
    fullName: string;
    active: boolean;
  } | null;
  createdAt?: string;
  updatedAt?: string;
};

export type ManagedUsersResponse = {
  users: ManagedUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
