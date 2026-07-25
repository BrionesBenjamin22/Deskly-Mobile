import { Prisma, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

export type BootstrapEnvironment = Record<string, string | undefined>;

export type BootstrapTransaction = {
  $executeRaw(query: TemplateStringsArray, ...values: unknown[]): Promise<number>;
  user: {
    count(): Promise<number>;
    create(input: {
      data: {
        email: string;
        username: string;
        passwordHash: string;
        role: UserRole;
      };
    }): Promise<unknown>;
  };
};

export type BootstrapDatabase = {
  $transaction<T>(
    operation: (transaction: BootstrapTransaction) => Promise<T>,
    options: { isolationLevel: Prisma.TransactionIsolationLevel },
  ): Promise<T>;
};

export async function bootstrapAdmin(
  database: BootstrapDatabase,
  environment: BootstrapEnvironment,
  hashPassword: (password: string, rounds: number) => Promise<string> = bcrypt.hash,
): Promise<void> {
  const email = required(environment, 'BOOTSTRAP_ADMIN_EMAIL')
    .trim()
    .toLowerCase();
  const username = required(environment, 'BOOTSTRAP_ADMIN_USERNAME')
    .trim()
    .toLowerCase();
  const password = required(environment, 'BOOTSTRAP_ADMIN_PASSWORD');

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255)
    throw new Error('BOOTSTRAP_ADMIN_EMAIL no es valido.');
  if (!/^[a-zA-Z0-9._-]{3,60}$/.test(username))
    throw new Error('BOOTSTRAP_ADMIN_USERNAME no es valido.');
  if (
    password.length < 12 ||
    password.length > 72 ||
    !/[A-Z]/.test(password) ||
    !/[a-z]/.test(password) ||
    !/[0-9]/.test(password)
  )
    throw new Error(
      'BOOTSTRAP_ADMIN_PASSWORD debe tener entre 12 y 72 caracteres, mayuscula, minuscula y numero.',
    );

  const passwordHash = await hashPassword(password, 12);
  await database.$transaction(
    async (transaction) => {
      await transaction.$executeRaw`SELECT pg_advisory_xact_lock(192837465)`;
      if ((await transaction.user.count()) !== 0)
        throw new Error('El sistema ya fue inicializado.');

      await transaction.user.create({
        data: {
          email,
          username,
          passwordHash,
          role: UserRole.ADMIN,
        },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

function required(environment: BootstrapEnvironment, key: string): string {
  const value = environment[key];
  if (!value) throw new Error(`${key} es obligatoria.`);
  return value;
}
