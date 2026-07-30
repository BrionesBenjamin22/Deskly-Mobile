import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infrastructure/database/prisma.service';
import {
  bootstrapAdmin,
  type BootstrapDatabase,
} from '../src/modules/auth/application/services/bootstrap-admin.service';

describe('Bootstrap administrativo (e2e PostgreSQL)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const suffix = Date.now();
  const adminEmail = `bootstrap-${suffix}@deskly.test`;
  const adminUsername = `bootstrap-${suffix}`;
  const memberEmail = `member-${suffix}@deskly.test`;
  const memberUsername = `member-${suffix}`;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    prisma = app.get(PrismaService);
    await cleanupFixtures();
  });

  afterAll(async () => {
    await cleanupFixtures();
    await app.close();
  });

  it('blocks public registration until bootstrap and never assigns ADMIN over HTTP', async () => {
    const statusBefore = await request(app.getHttpServer())
      .get('/auth/registration-status')
      .expect(200);
    expect(statusBefore.body).toEqual({
      requiresMember: true,
      registrationAvailable: false,
    });

    await request(app.getHttpServer())
      .post('/auth/register')
      .send(memberPayload())
      .expect(409);

    await bootstrapAdmin(
      prisma as unknown as BootstrapDatabase,
      {
        BOOTSTRAP_ADMIN_EMAIL: adminEmail,
        BOOTSTRAP_ADMIN_USERNAME: adminUsername,
        BOOTSTRAP_ADMIN_PASSWORD: 'SecureBootstrap123',
      },
      jest.fn().mockResolvedValue('bcrypt-bootstrap-hash'),
    );

    const statusAfter = await request(app.getHttpServer())
      .get('/auth/registration-status')
      .expect(200);
    expect(statusAfter.body).toEqual({
      requiresMember: true,
      registrationAvailable: true,
    });

    const registration = await request(app.getHttpServer())
      .post('/auth/register')
      .send(memberPayload())
      .expect(201);
    expect(registration.body.user.role).toBe('MIEMBRO');

    const persistedAdmin = await prisma.user.findUniqueOrThrow({
      where: { email: adminEmail },
    });
    expect(persistedAdmin.role).toBe('ADMIN');
    expect(persistedAdmin.passwordHash).toBe('bcrypt-bootstrap-hash');
  });

  it('emite y renueva una sesion con secretos independientes', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        identifier: memberEmail,
        password: 'MemberPassword123',
      })
      .expect(200);

    expect(login.body.access_token).toEqual(expect.any(String));
    expect(login.body.refresh_token).toEqual(expect.any(String));

    const refreshed = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: login.body.refresh_token })
      .expect(200);

    expect(refreshed.body.access_token).toEqual(expect.any(String));
    expect(refreshed.body.refresh_token).toEqual(expect.any(String));
    expect(refreshed.body.user.email).toBe(memberEmail);

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: login.body.access_token })
      .expect(401);
  });

  function memberPayload() {
    return {
      email: memberEmail,
      username: memberUsername,
      password: 'MemberPassword123',
      member: {
        fullName: 'Miembro Bootstrap',
        dni: 40_000_000 + (suffix % 1_000_000),
        phone: 11_000_000_000 + (suffix % 1_000_000),
      },
    };
  }

  async function cleanupFixtures() {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { email: adminEmail },
          { email: memberEmail },
          { username: adminUsername },
          { username: memberUsername },
        ],
      },
      include: { member: true },
    });
    const memberIds = users.flatMap((user) =>
      user.member ? [user.member.id] : [],
    );
    if (memberIds.length)
      await prisma.member.deleteMany({ where: { id: { in: memberIds } } });
    if (users.length)
      await prisma.user.deleteMany({
        where: { id: { in: users.map((user) => user.id) } },
      });
  }
});
