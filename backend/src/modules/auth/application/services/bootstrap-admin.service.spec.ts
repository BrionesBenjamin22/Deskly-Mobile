import { UserRole } from '@prisma/client';

import { bootstrapAdmin } from './bootstrap-admin.service';

function createDatabase(existingUsers = 0) {
  const transaction = {
    $executeRaw: jest.fn().mockResolvedValue(1),
    user: {
      count: jest.fn().mockResolvedValue(existingUsers),
      create: jest.fn().mockResolvedValue({ id: 'admin-1' }),
    },
  };
  const database = {
    $transaction: jest.fn(async (operation) => operation(transaction)),
  };
  return { database, transaction };
}

const environment = {
  BOOTSTRAP_ADMIN_EMAIL: 'ADMIN@DESKLY.TEST',
  BOOTSTRAP_ADMIN_USERNAME: 'Initial.Admin',
  BOOTSTRAP_ADMIN_PASSWORD: 'SecurePassword123',
};

describe('bootstrapAdmin', () => {
  it('creates one administrator without persisting the plain password', async () => {
    const { database, transaction } = createDatabase();
    const hashPassword = jest.fn().mockResolvedValue('bcrypt-hash');

    await bootstrapAdmin(database, environment, hashPassword);

    expect(hashPassword).toHaveBeenCalledWith('SecurePassword123', 12);
    expect(transaction.user.create).toHaveBeenCalledWith({
      data: {
        email: 'admin@deskly.test',
        username: 'initial.admin',
        passwordHash: 'bcrypt-hash',
        role: UserRole.ADMIN,
      },
    });
  });

  it('refuses to run after any user exists', async () => {
    const { database, transaction } = createDatabase(1);

    await expect(
      bootstrapAdmin(
        database,
        environment,
        jest.fn().mockResolvedValue('bcrypt-hash'),
      ),
    ).rejects.toThrow('ya fue inicializado');
    expect(transaction.user.create).not.toHaveBeenCalled();
  });

  it('validates bootstrap credentials before opening a transaction', async () => {
    const { database } = createDatabase();

    await expect(
      bootstrapAdmin(database, {
        ...environment,
        BOOTSTRAP_ADMIN_PASSWORD: 'weak',
      }),
    ).rejects.toThrow('BOOTSTRAP_ADMIN_PASSWORD');
    expect(database.$transaction).not.toHaveBeenCalled();
  });
});
