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
}
