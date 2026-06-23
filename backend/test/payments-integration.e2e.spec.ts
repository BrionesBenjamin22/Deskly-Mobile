import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Payments Integration Tests (e2e)', () => {
  let app: INestApplication;
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
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Payment Flow', () => {
    // Primero crear una reserva para usar en los tests
    beforeAll(async () => {
      // Obtener un desk válido
      const desksResponse = await request(app.getHttpServer())
        .get('/desks')
        .expect(200);

      const deskId = desksResponse.body.desks[0]?.deskId;

      if (!deskId) {
        throw new Error('No desk found for testing');
      }

      // Crear una reserva
      const reservationResponse = await request(app.getHttpServer())
        .post('/reservations')
        .send({
          deskId,
          date: '2026-06-25',
          startTime: '09:00',
          endTime: '13:00',
        })
        .expect(201);

      reservationId = reservationResponse.body.reservationId;
    });

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
