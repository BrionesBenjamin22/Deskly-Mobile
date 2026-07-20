import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { AuthenticatedRequest } from '../../../auth/interfaces/http/auth-request';
import { JwtAuthGuard } from '../../../auth/interfaces/http/guards/jwt-auth.guard';
import { CreatePaymentUseCase } from '../../application/use-cases/create-payment.use-case';
import {
  GetPaymentAttemptUseCase,
  ListReservationPaymentsUseCase,
  PaymentAccessDeniedError,
} from '../../application/use-cases/query-payment-attempts.use-cases';
import {
  InvalidPaymentAttemptError,
  PaymentGatewayError,
  PaymentIdempotencyConflictError,
} from '../../domain/errors/payment-domain.errors';
import { ReservationNotFoundError } from '../../domain/errors/reservation-not-found.error';
import { PaymentNotFoundError } from '../../domain/errors/payment-not-found.error';
import { CreatePaymentBodyDto } from './dto/create-payment-body.dto';

@ApiTags('Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly createPayment: CreatePaymentUseCase,
    private readonly getPayment: GetPaymentAttemptUseCase,
  ) {}

  @Post('checkout')
  @ApiCreatedResponse({
    description: 'Checkout creado o recuperado de forma idempotente.',
  })
  @ApiBadRequestResponse({
    description: 'Payload o clave de idempotencia invalidos.',
  })
  @ApiConflictResponse({
    description: 'Reserva no pagable o clave reutilizada.',
  })
  @ApiNotFoundResponse({ description: 'Reserva no encontrada.' })
  async checkout(
    @Body() body: CreatePaymentBodyDto,
    @Headers('idempotency-key') key: string | undefined,
    @Req() request: AuthenticatedRequest,
  ) {
    if (!key || !/^[A-Za-z0-9._:-]{8,160}$/.test(key))
      throw new BadRequestException({
        message: 'Idempotency-Key invalida.',
        error:
          'Lo sentimos, genere una nueva clave de operacion e intente nuevamente.',
      });
    if (!request.user.member)
      throw new BadRequestException({
        message: 'El usuario no posee un miembro asociado.',
        error:
          'Lo sentimos, complete sus datos de miembro e intente nuevamente.',
      });
    try {
      return await this.createPayment.execute({
        ...body,
        memberId: request.user.member.id,
        idempotencyKey: key,
      });
    } catch (error) {
      if (error instanceof ReservationNotFoundError)
        throw new NotFoundException({
          message: error.message,
          error:
            'Lo sentimos, no pudimos recuperar la reserva. Verifique los datos e intente nuevamente.',
        });
      if (
        error instanceof InvalidPaymentAttemptError ||
        error instanceof PaymentIdempotencyConflictError
      )
        throw new ConflictException({
          message: error.message,
          error:
            'Lo sentimos, no pudimos iniciar el pago. Revise la reserva y vuelva a intentarlo.',
        });
      if (error instanceof PaymentGatewayError)
        throw new ConflictException({
          message: 'No fue posible crear el checkout.',
          error:
            'Lo sentimos, el proveedor de pagos no esta disponible. Intente nuevamente.',
        });
      throw error;
    }
  }

  @Get(':id')
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: AuthenticatedRequest,
  ) {
    try {
      return await this.getPayment.execute(id, {
        role: request.user.role,
        memberId: request.user.member?.id,
      });
    } catch (error) {
      handleQueryError(error);
    }
  }
}

@ApiTags('Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reservations')
export class ReservationPaymentsController {
  constructor(private readonly listPayments: ListReservationPaymentsUseCase) {}

  @Get(':id/payments')
  async listByReservation(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: AuthenticatedRequest,
  ) {
    try {
      return await this.listPayments.execute(id, {
        role: request.user.role,
        memberId: request.user.member?.id,
      });
    } catch (error) {
      handleQueryError(error);
    }
  }
}

function handleQueryError(error: unknown): never {
  if (
    error instanceof PaymentNotFoundError ||
    error instanceof ReservationNotFoundError
  )
    throw new NotFoundException({
      message: error.message,
      error:
        'Lo sentimos, no pudimos recuperar la informacion solicitada. Verifique los datos e intente nuevamente.',
    });
  if (error instanceof PaymentAccessDeniedError)
    throw new ForbiddenException({
      message: error.message,
      error:
        'Lo sentimos, no tiene permisos para consultar estos pagos. Seleccione una reserva propia e intente nuevamente.',
    });
  throw error;
}
