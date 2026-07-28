import { User, UserRoleValue } from '../entities/user.entity';

export const AUTH_REPOSITORY = Symbol('AUTH_REPOSITORY');

export type RegisterUserParams = {
  email: string;
  username: string;
  passwordHash: string;
  member?: { fullName: string; dni: number; phone: number };
};

export type RegisterUserResult = {
  user: User;
  isFirstUser: boolean;
};

export type UpdateProfileParams = {
  userId: string;
  email?: string;
  username?: string;
  fullName?: string;
  phone?: number;
};

export type ChangePasswordParams = {
  userId: string;
  newPasswordHash: string;
};

export type ListUsersParams = {
  page: number;
  limit: number;
  search?: string;
};

export type ListUsersResult = {
  users: User[];
  total: number;
};

export interface AuthRepositoryPort {
  hasUsers(): Promise<boolean>;
  register(params: RegisterUserParams): Promise<RegisterUserResult>;
  findByIdentifier(identifier: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  updateRole(params: {
    userId: string;
    role: UserRoleValue;
    changedById: string;
  }): Promise<User | null>;
  updateProfile(params: UpdateProfileParams): Promise<User | null>;
  changePassword(params: ChangePasswordParams): Promise<void>;
  listUsers(params: ListUsersParams): Promise<ListUsersResult>;
  deactivate(params: {
    userId: string;
    changedById: string;
  }): Promise<User | null>;
  restoreAccess(params: {
    userId: string;
    changedById: string;
  }): Promise<User | null>;
}
