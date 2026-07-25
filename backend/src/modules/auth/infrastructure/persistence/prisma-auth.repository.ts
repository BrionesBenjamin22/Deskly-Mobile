import { Injectable } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';

import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { User } from '../../domain/entities/user.entity';
import {
  MemberDataRequiredError,
  SystemNotInitializedError,
  LastActiveAdminError,
  UserAlreadyInactiveError,
  UserAlreadyExistsError,
} from '../../domain/errors/auth.errors';
import {
  AuthRepositoryPort,
  ChangePasswordParams,
  ListUsersParams,
  ListUsersResult,
  RegisterUserParams,
  RegisterUserResult,
  UpdateProfileParams,
} from '../../domain/ports/auth-repository.port';

const userWithMember = { member: true } as const;
type PersistedUser = Prisma.UserGetPayload<{ include: typeof userWithMember }>;

@Injectable()
export class PrismaAuthRepository implements AuthRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async hasUsers(): Promise<boolean> {
    return (await this.prisma.user.count()) > 0;
  }

  async register(params: RegisterUserParams): Promise<RegisterUserResult> {
    try {
      return await this.prisma.$transaction(
        async (transaction) => {
          await transaction.$executeRaw`SELECT pg_advisory_xact_lock(192837465)`;
          const isFirstUser = (await transaction.user.count()) === 0;

          if (isFirstUser) throw new SystemNotInitializedError();
          if (!params.member) throw new MemberDataRequiredError();

          const user = await transaction.user.create({
            data: {
              email: params.email,
              username: params.username,
              passwordHash: params.passwordHash,
              role: UserRole.MIEMBRO,
              member: {
                create: {
                  ...params.member,
                  phone: BigInt(params.member.phone),
                },
              },
            },
            include: userWithMember,
          });

          return { user: this.toDomain(user), isFirstUser: false };
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

      if (
        current.active &&
        current.role === UserRole.ADMIN &&
        params.role !== UserRole.ADMIN &&
        (await transaction.user.count({
          where: { role: UserRole.ADMIN, active: true },
        })) <= 1
      ) {
        throw new LastActiveAdminError();
      }

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

  async changePassword(params: ChangePasswordParams): Promise<void> {
    await this.prisma.user.update({
      where: { id: params.userId },
      data: {
        passwordHash: params.newPasswordHash,
        tokenVersion: { increment: 1 },
      },
    });
  }

  async listUsers(params: ListUsersParams): Promise<ListUsersResult> {
    const search = params.search?.trim();
    const where = search
      ? {
          OR: [
            {
              username: {
                contains: search,
                mode: Prisma.QueryMode.insensitive,
              },
            },
            { email: { contains: search, mode: Prisma.QueryMode.insensitive } },
            {
              member: {
                fullName: {
                  contains: search,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
            },
          ],
        }
      : {};
    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        include: userWithMember,
        orderBy: [{ active: 'desc' }, { username: 'asc' }],
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      this.prisma.user.count({ where }),
    ]);
    return { users: users.map((user) => this.toDomain(user)), total };
  }

  async deactivate(params: {
    userId: string;
    changedById: string;
  }): Promise<User | null> {
    return this.prisma.$transaction(async (transaction) => {
      const current = await transaction.user.findUnique({
        where: { id: params.userId },
      });
      if (!current) return null;
      if (!current.active) throw new UserAlreadyInactiveError();
      if (
        current.role === UserRole.ADMIN &&
        (await transaction.user.count({
          where: { role: UserRole.ADMIN, active: true },
        })) <= 1
      ) {
        throw new LastActiveAdminError();
      }

      await transaction.userStatusHistory.create({
        data: {
          userId: params.userId,
          changedById: params.changedById,
          previousActive: true,
          newActive: false,
        },
      });
      const user = await transaction.user.update({
        where: { id: params.userId },
        data: {
          active: false,
          ...((await transaction.member.findUnique({
            where: { userId: params.userId },
          }))
            ? { member: { update: { active: false } } }
            : {}),
        },
        include: userWithMember,
      });
      return this.toDomain(user);
    });
  }

  async restoreAccess(params: {
    userId: string;
    changedById: string;
  }): Promise<User | null> {
    return this.prisma.$transaction(async (transaction) => {
      const current = await transaction.user.findUnique({
        where: { id: params.userId },
        include: { member: true },
      });
      if (!current) return null;

      await transaction.userStatusHistory.create({
        data: {
          userId: params.userId,
          changedById: params.changedById,
          previousActive: current.active,
          newActive: true,
        },
      });
      const user = await transaction.user.update({
        where: { id: params.userId },
        data: {
          active: true,
          blockedUntil: null,
          ...(current.member ? { member: { update: { active: true } } } : {}),
        },
        include: userWithMember,
      });
      return this.toDomain(user);
    });
  }

  async updateProfile(params: UpdateProfileParams): Promise<User | null> {
    try {
      return await this.prisma.$transaction(async (transaction) => {
        const updateData: Prisma.UserUpdateInput = {};

        if (params.email) updateData.email = params.email;
        if (params.username) updateData.username = params.username;

        if (params.fullName || params.phone) {
          updateData.member = {
            update: {},
          };

          if (params.fullName) {
            (updateData.member as any).update.fullName = params.fullName;
          }
          if (params.phone) {
            (updateData.member as any).update.phone = BigInt(params.phone);
          }
        }

        const user = await transaction.user.update({
          where: { id: params.userId },
          data: updateData,
          include: userWithMember,
        });
        return this.toDomain(user);
      });
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

  private toDomain(user: PersistedUser): User {
    return new User({
      id: user.id,
      email: user.email,
      username: user.username,
      passwordHash: user.passwordHash,
      role: user.role,
      active: user.active,
      blockedUntil: user.blockedUntil,
      tokenVersion: user.tokenVersion,
      member: user.member
        ? {
            id: user.member.id,
            fullName: user.member.fullName,
            dni: user.member.dni,
            phone: Number(user.member.phone),
            active: user.member.active,
          }
        : null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  }
}
