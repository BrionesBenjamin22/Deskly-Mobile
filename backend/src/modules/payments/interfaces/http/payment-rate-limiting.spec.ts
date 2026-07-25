import {
  ExecutionContext,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import type { Server } from 'node:http';
import request from 'supertest';

import type { AuthenticatedRequest } from '../../../auth/interfaces/http/auth-request';
import { JwtAuthGuard } from '../../../auth/interfaces/http/guards/jwt-auth.guard';
import { CreatePaymentUseCase } from '../../application/use-cases/create-payment.use-case';
import { GetPaymentAttemptUseCase } from '../../application/use-cases/query-payment-attempts.use-cases';
import { PaymentsController } from './payments.controller';

describe('Payments rate limiting (HTTP)', () => {
  let app: INestApplication;
  let server: Server;
  const createPayment = {
    execute: jest.fn().mockResolvedValue({
      paymentId: '550e8400-e29b-41d4-a716-446655440002',
      reservationId: '550e8400-e29b-41d4-a716-446655440001',
      status: 'PENDING',
    }),
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot([{ ttl: 60_000, limit: 30 }])],
      controllers: [PaymentsController],
      providers: [
        ThrottlerGuard,
        {
          provide: CreatePaymentUseCase,
          useValue: createPayment,
        },
        {
          provide: GetPaymentAttemptUseCase,
          useValue: { execute: jest.fn() },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate(context: ExecutionContext) {
          const httpRequest = context
            .switchToHttp()
            .getRequest<AuthenticatedRequest>();
          httpRequest.user = {
            id: 'user-rate-limit',
            email: 'rate-limit@deskly.test',
            username: 'user-rate-limit',
            role: 'MIEMBRO',
            active: true,
            member: {
              id: 'member-rate-limit',
              fullName: 'Rate Limit',
              dni: 12345678,
              phone: 1112345678n,
              active: true,
            },
          };
          return true;
        },
      })
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    server = app.getHttpServer() as Server;
  });

  afterAll(async () => {
    await app.close();
  });

  it('responde 429 antes de crear un sexto checkout en un minuto', async () => {
    for (let index = 1; index <= 5; index += 1) {
      await request(server)
        .post('/payments/checkout')
        .set('Idempotency-Key', `rate-limit-${index}`)
        .send({
          reservationId: '550e8400-e29b-41d4-a716-446655440001',
          option: 'FULL',
        })
        .expect(201);
    }

    await request(server)
      .post('/payments/checkout')
      .set('Idempotency-Key', 'rate-limit-6')
      .send({
        reservationId: '550e8400-e29b-41d4-a716-446655440001',
        option: 'FULL',
      })
      .expect(429);

    expect(createPayment.execute).toHaveBeenCalledTimes(5);
  });
});
