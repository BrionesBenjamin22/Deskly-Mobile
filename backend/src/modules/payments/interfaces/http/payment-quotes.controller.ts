import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import type { AuthenticatedRequest } from '../../../auth/interfaces/http/auth-request';
import { JwtAuthGuard } from '../../../auth/interfaces/http/guards/jwt-auth.guard';
import { GetPaymentQuoteUseCase } from '../../application/use-cases/get-payment-quote.use-case';
import { PaymentAccessDeniedError } from '../../application/use-cases/query-payment-attempts.use-cases';
import { InvalidPaymentAttemptError } from '../../domain/errors/payment-domain.errors';
import { ReservationNotFoundError } from '../../domain/errors/reservation-not-found.error';

@ApiTags('Payment quotes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reservations')
export class PaymentQuotesController {
  constructor(private readonly quote: GetPaymentQuoteUseCase) {}

  @Get(':id/payment-quote')
  @ApiOkResponse({ description: 'Cotizacion ARS calculada por backend.' })
  async getQuote(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: AuthenticatedRequest,
  ) {
    if (!request.user.member)
      throw new BadRequestException({
        message: 'El usuario no posee un miembro asociado.',
        error:
          'Lo sentimos, complete sus datos de miembro e intente nuevamente.',
      });
    try {
      return await this.quote.execute(id, request.user.member.id);
    } catch (error) {
      if (
        error instanceof ReservationNotFoundError ||
        (error instanceof Error && error.name === 'ReservationNotFoundError')
      )
        throw new NotFoundException({
          message: error.message,
          error:
            'Lo sentimos, no pudimos recuperar la reserva. Verifique los datos e intente nuevamente.',
        });
      if (
        error instanceof PaymentAccessDeniedError ||
        (error instanceof Error && error.name === 'PaymentAccessDeniedError')
      )
        throw new ForbiddenException({
          message: 'No tiene permisos para cotizar esta reserva.',
          error:
            'Lo sentimos, seleccione una reserva propia e intente nuevamente.',
        });
      if (
        error instanceof InvalidPaymentAttemptError ||
        (error instanceof Error && error.name === 'InvalidPaymentAttemptError')
      )
        throw new BadRequestException({
          message: error.message,
          error:
            'Lo sentimos, la reserva no puede cotizarse. Revise su estado e intente nuevamente.',
        });
      throw error;
    }
  }
}
