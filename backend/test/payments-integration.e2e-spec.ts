import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infrastructure/database/prisma.service';
import { PaymentAttempt } from '../src/modules/payments/domain/entities/payment-attempt.entity';
import {
  PAYMENT_ATTEMPT_REPOSITORY,
  PaymentAttemptRepositoryPort,
} from '../src/modules/payments/domain/ports/payment-attempt-repository.port';

describe('Payments autenticados (e2e PostgreSQL)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;
  let otherToken: string;
  let reservationId: string;
  let memberId: string;
  let deskId: string;
  let fixture: string;

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
    fixture = `payments-stage3-${Date.now()}`;
    const locality = await prisma.locality.create({ data: { name: fixture } });
    const area = await prisma.workArea.create({
      data: { name: fixture, localityId: locality.id },
    });
    const desk = await prisma.desk.create({
      data: { name: fixture, areaId: area.id },
    });
    deskId = desk.id;
    const user = await prisma.user.create({
      data: {
        email: `${fixture}@deskly.test`,
        username: fixture,
        passwordHash: 'no-login',
        member: {
          create: {
            fullName: 'Miembro Payments E2E',
            dni: Number(String(Date.now()).slice(-8)),
            phone: BigInt(`11${String(Date.now()).slice(-8)}`),
          },
        },
      },
      include: { member: true },
    });
    const other = await prisma.user.create({
      data: {
        email: `other-${fixture}@deskly.test`,
        username: `other-${fixture}`,
        passwordHash: 'no-login',
        member: {
          create: {
            fullName: 'Otro Miembro E2E',
            dni: Number(String(Date.now() + 1).slice(-8)),
            phone: BigInt(`12${String(Date.now()).slice(-8)}`),
          },
        },
      },
      include: { member: true },
    });
    const reservation = await prisma.reservation.create({
      data: {
        deskId: desk.id,
        memberId: user.member!.id,
        date: new Date('2026-07-25T00:00:00.000Z'),
        startTime: new Date('1970-01-01T09:00:00.000Z'),
        endTime: new Date('1970-01-01T13:00:00.000Z'),
      },
    });
    memberId = user.member!.id;
    reservationId = reservation.id;
    const jwt = app.get(JwtService);
    token = await jwt.signAsync({}, { subject: user.id });
    otherToken = await jwt.signAsync({}, { subject: other.id });
  });

  afterAll(async () => {
    const users = await prisma.user.findMany({
      where: { OR: [{ username: fixture }, { username: `other-${fixture}` }] },
      include: { member: true },
    });
    const memberIds = users.flatMap((user) =>
      user.member ? [user.member.id] : [],
    );
    const reservations = await prisma.reservation.findMany({
      where: { memberId: { in: memberIds } },
      select: { id: true },
    });
    await prisma.paymentEvent.deleteMany({
      where: {
        payment: { reservationId: { in: reservations.map((item) => item.id) } },
      },
    });
    await prisma.payment.deleteMany({
      where: { reservationId: { in: reservations.map((item) => item.id) } },
    });
    await prisma.reservation.deleteMany({
      where: { id: { in: reservations.map((item) => item.id) } },
    });
    await prisma.member.deleteMany({ where: { id: { in: memberIds } } });
    await prisma.user.deleteMany({
      where: { id: { in: users.map((user) => user.id) } },
    });
    const desks = await prisma.desk.findMany({
      where: { name: fixture },
      select: { id: true, areaId: true },
    });
    await prisma.desk.deleteMany({
      where: { id: { in: desks.map((desk) => desk.id) } },
    });
    await prisma.workArea.deleteMany({
      where: { id: { in: desks.map((desk) => desk.areaId) } },
    });
    await prisma.locality.deleteMany({ where: { name: fixture } });
    await app.close();
  });

  it('exige autenticacion', () =>
    request(app.getHttpServer())
      .post('/payments/checkout')
      .set('Idempotency-Key', 'e2e-checkout-001')
      .send({ reservationId, option: 'FULL' })
      .expect(401));

  it('rechaza importes controlados por el cliente', () =>
    request(app.getHttpServer())
      .post('/payments/checkout')
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', 'e2e-checkout-002')
      .send({ reservationId, option: 'FULL', amount: 1 })
      .expect(400));

  it('crea un unico checkout y reutiliza la respuesta', async () => {
    const call = () =>
      request(app.getHttpServer())
        .post('/payments/checkout')
        .set('Authorization', `Bearer ${token}`)
        .set('Idempotency-Key', 'e2e-checkout-003')
        .send({ reservationId, option: 'DEPOSIT' })
        .expect(201);
    const first = await call();
    const second = await call();
    expect(second.body).toEqual(first.body);
    expect(first.body).toMatchObject({
      reservationId,
      amountMinorUnits: 180_000,
      status: 'PENDING',
    });
    expect(await prisma.payment.count({ where: { reservationId } })).toBe(1);
  });

  it('protege detalle y listado por propiedad', async () => {
    const payment = await prisma.payment.findFirstOrThrow({
      where: { reservationId },
    });
    await request(app.getHttpServer())
      .get(`/payments/${payment.id}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(403);
    await request(app.getHttpServer())
      .get(`/reservations/${reservationId}/payments`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(403);
    const own = await request(app.getHttpServer())
      .get(`/reservations/${reservationId}/payments`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(own.body).toHaveLength(1);
  });

  it('revierte el pago si el hold local no puede crearse', async () => {
    const cancelled = await prisma.reservation.create({
      data: {
        deskId,
        memberId,
        date: new Date('2026-07-26T00:00:00.000Z'),
        startTime: new Date('1970-01-01T09:00:00.000Z'),
        endTime: new Date('1970-01-01T10:00:00.000Z'),
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    });
    const repository = app.get<PaymentAttemptRepositoryPort>(
      PAYMENT_ATTEMPT_REPOSITORY,
    );
    const attempt = new PaymentAttempt({
      reservationId: cancelled.id,
      memberId,
      amountMinorUnits: 150_000,
      currency: 'ARS',
      option: 'FULL',
      pricingVersion: 'ARS_1500_HOUR_DEPOSIT_30_V1',
      provider: 'FAKE',
      status: 'PENDING',
      idempotencyKey: `rollback-${fixture}`,
      operationFingerprint: 'rollback-fingerprint',
      externalReference: `reservation:${cancelled.id}`,
      expiresAt: new Date(Date.now() + 15 * 60_000),
    });

    await expect(repository.createWithReservationHold(attempt)).rejects.toThrow(
      'La reserva no pudo bloquearse para el pago.',
    );
    await expect(
      prisma.payment.count({ where: { reservationId: cancelled.id } }),
    ).resolves.toBe(0);
  });
});
