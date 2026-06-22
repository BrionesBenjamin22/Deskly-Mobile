import { Injectable } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';

import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { User } from '../../domain/entities/user.entity';
import {
  MemberDataRequiredError,
  UserAlreadyExistsError,
} from '../../domain/errors/auth.errors';
import {
  AuthRepositoryPort,
  RegisterUserParams,
  RegisterUserResult,
} from '../../domain/ports/auth-repository.port';

const userWithMember = { member: true } as const;
type PersistedUser = Prisma.UserGetPayload<{ include: typeof userWithMember }>;

@Injectable()
export class PrismaAuthRepository implements AuthRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async register(params: RegisterUserParams): Promise<RegisterUserResult> {
    try {
      return await this.prisma.$transaction(
        async (transaction) => {
          await transaction.$executeRaw`SELECT pg_advisory_xact_lock(192837465)`;
          const isFirstUser = (await transaction.user.count()) === 0;

          if (!isFirstUser && !params.member)
            throw new MemberDataRequiredError();

          const user = await transaction.user.create({
            data: {
              email: params.email,
              username: params.username,
              passwordHash: params.passwordHash,
              role: isFirstUser ? UserRole.ADMIN : UserRole.MIEMBRO,
              ...(!isFirstUser && params.member
                ? { member: { create: params.member } }
                : {}),
            },
            include: userWithMember,
          });

          return { user: this.toDomain(user), isFirstUser };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new UserAlreadyExistsError();
      }
      throw error;
    }
  }

  async findByIdentifier(identifier: string): Promise<User | null> {
    const user = await this.prisma.user.findFirst({
      where: { OR: [{ email: identifier }, { username: identifier }] },
      include: userWithMember,
    });
    return user ? this.toDomain(user) : null;
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: userWithMember,
    });
    return user ? this.toDomain(user) : null;
  }

  async updateRole(params: {
    userId: string;
    role: UserRole;
    changedById: string;
  }): Promise<User | null> {
    return this.prisma.$transaction(async (transaction) => {
      const current = await transaction.user.findUnique({
        where: { id: params.userId },
      });
      if (!current) return null;

      if (current.role !== params.role) {
        await transaction.userRoleHistory.create({
          data: {
            userId: params.userId,
            changedById: params.changedById,
            previousRole: current.role,
            newRole: params.role,
          },
        });
      }

      const user = await transaction.user.update({
        where: { id: params.userId },
        data: { role: params.role },
        include: userWithMember,
      });
      return this.toDomain(user);
    });
  }

  private toDomain(user: PersistedUser): User {
    return new User({
      id: user.id,
      email: user.email,
      username: user.username,
      passwordHash: user.passwordHash,
      role: user.role,
      active: user.active,
      member: user.member
        ? {
            id: user.member.id,
            fullName: user.member.fullName,
            dni: user.member.dni,
            phone: user.member.phone,
            active: user.member.active,
          }
        : null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  }
}
