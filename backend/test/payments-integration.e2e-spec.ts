/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infrastructure/database/prisma.service';

describe('Payments Integration Tests (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let memberId: string;
  let deskId: string;
  let reservationId: string;
  let paymentId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    prisma = app.get(PrismaService);
    await cleanupPaymentFixtures(prisma);
    const uniqueSuffix = `${Date.now()}${Math.floor(Math.random() * 100_000)}`;
    const user = await prisma.user.create({
      data: {
        email: `payments-e2e-${uniqueSuffix}@deskly.test`,
        username: `payments_e2e_${uniqueSuffix}`,
        passwordHash: 'not-used-by-payments-e2e',
        member: {
          create: {
            fullName: 'Payments E2E Member',
            dni: Number(uniqueSuffix.slice(-9)),
            phone: BigInt(`11${uniqueSuffix.slice(-8)}`),
          },
        },
      },
      include: { member: true },
    });

    if (!user.member) {
      throw new Error('Payment test member was not created');
    }

    memberId = user.member.id;

    const desk = await prisma.desk.create({
      data: {
        name: `Payments E2E Desk ${uniqueSuffix}`,
        peopleCapacity: 1,
        enabled: true,
      },
    });
    deskId = desk.id;

    const reservation = await prisma.reservation.create({
      data: {
        deskId,
        memberId,
        date: new Date('2026-06-25T00:00:00.000Z'),
        startTime: new Date('1970-01-01T09:00:00.000Z'),
        endTime: new Date('1970-01-01T13:00:00.000Z'),
      },
    });
    reservationId = reservation.id;
  });

  afterAll(async () => {
    try {
      await cleanupPaymentFixtures(prisma);
    } finally {
      await app.close();
    }
  });

  describe('Payment Flow', () => {
    describe('POST /payments', () => {
      it('should create a payment successfully', async () => {
        const response = await request(app.getHttpServer())
          .post('/payments')
          .send({
            reservationId,
            date: '2026-06-22',
            amount: 100.5,
          })
          .expect(201);

        expect(response.body).toMatchObject({
          paymentId: expect.any(String),
          reservationId,
          date: '2026-06-22',
          amount: 100.5,
        });

        paymentId = response.body.paymentId;
      });

      it('should fail with invalid UUID', async () => {
        await request(app.getHttpServer())
          .post('/payments')
          .send({
            reservationId: 'invalid-uuid',
            date: '2026-06-22',
            amount: 100.5,
          })
          .expect(400);
      });

      it('should fail with invalid date format', async () => {
        await request(app.getHttpServer())
          .post('/payments')
          .send({
            reservationId,
            date: '22-06-2026',
            amount: 100.5,
          })
          .expect(400);
      });

      it('should fail with amount <= 0', async () => {
        await request(app.getHttpServer())
          .post('/payments')
          .send({
            reservationId,
            date: '2026-06-22',
            amount: 0,
          })
          .expect(400);
      });

      it('should fail with non-existent reservation', async () => {
        await request(app.getHttpServer())
          .post('/payments')
          .send({
            reservationId: '550e8400-e29b-41d4-a716-446655440000',
            date: '2026-06-22',
            amount: 100.5,
          })
          .expect(404);
      });
    });

    describe('GET /payments', () => {
      it('should list payments with pagination', async () => {
        const response = await request(app.getHttpServer())
          .get('/payments?page=1&limit=9')
          .expect(200);

        expect(response.body).toMatchObject({
          payments: expect.any(Array),
          pagination: {
            page: 1,
            limit: 9,
            total: expect.any(Number),
            totalPages: expect.any(Number),
          },
        });

        expect(response.body.payments.length).toBeGreaterThan(0);
      });

      it('should filter by reservationId', async () => {
        const response = await request(app.getHttpServer())
          .get(`/payments?page=1&limit=9&reservationId=${reservationId}`)
          .expect(200);

        expect(response.body.payments).toBeDefined();
        expect(Array.isArray(response.body.payments)).toBe(true);

        // Verificar que todos los pagos pertenecen a la reserva
        if (response.body.payments.length > 0) {
          response.body.payments.forEach((payment: any) => {
            expect(payment.reservationId).toBe(reservationId);
          });
        }
      });

      it('should handle invalid page parameter', async () => {
        await request(app.getHttpServer())
          .get('/payments?page=0&limit=9')
          .expect(400);
      });

      it('should handle invalid limit parameter', async () => {
        await request(app.getHttpServer())
          .get('/payments?page=1&limit=100')
          .expect(400);
      });
    });

    describe('GET /payments/:id', () => {
      it('should return payment details', async () => {
        const response = await request(app.getHttpServer())
          .get(`/payments/${paymentId}`)
          .expect(200);

        expect(response.body).toMatchObject({
          paymentId,
          reservationId,
          date: expect.any(String),
          amount: expect.any(Number),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        });
      });

      it('should return 404 for non-existent payment', async () => {
        await request(app.getHttpServer())
          .get('/payments/550e8400-e29b-41d4-a716-446655440000')
          .expect(404);
      });

      it('should return 400 for invalid UUID', async () => {
        await request(app.getHttpServer())
          .get('/payments/invalid-uuid')
          .expect(400);
      });
    });

    describe('DELETE /payments/:id', () => {
      it('should delete payment successfully', async () => {
        // Crear un pago para eliminar
        const createResponse = await request(app.getHttpServer())
          .post('/payments')
          .send({
            reservationId,
            date: '2026-06-23',
            amount: 50.25,
          })
          .expect(201);

        const paymentToDelete = createResponse.body.paymentId;

        // Eliminar el pago
        await request(app.getHttpServer())
          .delete(`/payments/${paymentToDelete}`)
          .expect(204);

        // Verificar que el pago fue eliminado
        await request(app.getHttpServer())
          .get(`/payments/${paymentToDelete}`)
          .expect(404);
      });

      it('should return 404 when deleting non-existent payment', async () => {
        await request(app.getHttpServer())
          .delete('/payments/550e8400-e29b-41d4-a716-446655440000')
          .expect(404);
      });

      it('should return 400 for invalid UUID', async () => {
        await request(app.getHttpServer())
          .delete('/payments/invalid-uuid')
          .expect(400);
      });
    });

    describe('Multiple payments for same reservation', () => {
      it('should handle multiple payments for the same reservation', async () => {
        // Crear varios pagos
        const payment1 = await request(app.getHttpServer())
          .post('/payments')
          .send({
            reservationId,
            date: '2026-06-24',
            amount: 50,
          })
          .expect(201);

        const payment2 = await request(app.getHttpServer())
          .post('/payments')
          .send({
            reservationId,
            date: '2026-06-25',
            amount: 75.5,
          })
          .expect(201);

        // Listar pagos de la reserva
        const listResponse = await request(app.getHttpServer())
          .get(`/payments?reservationId=${reservationId}`)
          .expect(200);

        const paymentIds = listResponse.body.payments.map(
          (p: any) => p.paymentId,
        );

        expect(paymentIds).toContain(payment1.body.paymentId);
        expect(paymentIds).toContain(payment2.body.paymentId);
      });
    });
  });
});

async function cleanupPaymentFixtures(prisma: PrismaService): Promise<void> {
  const users = await prisma.user.findMany({
    where: { email: { startsWith: 'payments-e2e-' } },
    include: { member: { select: { id: true } } },
  });
  const memberIds = users.flatMap((user) =>
    user.member ? [user.member.id] : [],
  );
  const desks = await prisma.desk.findMany({
    where: { name: { startsWith: 'Payments E2E Desk ' } },
    select: { id: true },
  });
  const deskIds = desks.map((desk) => desk.id);
  const reservations = await prisma.reservation.findMany({
    where: {
      OR: [
        ...(memberIds.length > 0 ? [{ memberId: { in: memberIds } }] : []),
        ...(deskIds.length > 0 ? [{ deskId: { in: deskIds } }] : []),
      ],
    },
    select: { id: true },
  });
  const reservationIds = reservations.map((reservation) => reservation.id);

  if (reservationIds.length > 0) {
    await prisma.payment.deleteMany({
      where: { reservationId: { in: reservationIds } },
    });
    await prisma.reservation.deleteMany({
      where: { id: { in: reservationIds } },
    });
  }
  if (deskIds.length > 0) {
    await prisma.desk.deleteMany({ where: { id: { in: deskIds } } });
  }
  if (memberIds.length > 0) {
    await prisma.member.deleteMany({ where: { id: { in: memberIds } } });
  }
  if (users.length > 0) {
    await prisma.user.deleteMany({
      where: { id: { in: users.map((user) => user.id) } },
    });
  }
}
