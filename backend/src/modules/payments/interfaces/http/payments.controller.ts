import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';

import { CreatePaymentUseCase } from '../../application/use-cases/create-payment.use-case';
import { DeletePaymentUseCase } from '../../application/use-cases/delete-payment.use-case';
import { GetPaymentByIdUseCase } from '../../application/use-cases/get-payment-by-id.use-case';
import { ListPaymentsUseCase } from '../../application/use-cases/list-payments.use-case';
import { PaymentNotFoundError } from '../../domain/errors/payment-not-found.error';
import { ReservationNotFoundError } from '../../domain/errors/reservation-not-found.error';
import { CreatePaymentBodyDto } from './dto/create-payment-body.dto';
import { ListPaymentsQueryDto } from './dto/list-payments-query.dto';
import { PaymentResponseDto } from './dto/payment-response.dto';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly createPaymentUseCase: CreatePaymentUseCase,
    private readonly listPaymentsUseCase: ListPaymentsUseCase,
    private readonly getPaymentByIdUseCase: GetPaymentByIdUseCase,
    private readonly deletePaymentUseCase: DeletePaymentUseCase,
  ) {}

  @Post()
  @ApiCreatedResponse({
    description: 'Pago creado correctamente.',
    type: PaymentResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Datos invalidos.' })
  @ApiNotFoundResponse({ description: 'Reserva no encontrada.' })
  async create(@Body() body: CreatePaymentBodyDto) {
    try {
      return await this.createPaymentUseCase.execute(body);
    } catch (error) {
      this.handleError(error);
    }
  }

  @Get()
  @ApiOkResponse({ description: 'Listado paginado de pagos.' })
  async list(@Query() query: ListPaymentsQueryDto) {
    return this.listPaymentsUseCase.execute(query);
  }

  @Get(':id')
  @ApiOkResponse({
    description: 'Detalle del pago.',
    type: PaymentResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Pago no encontrado.' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    try {
      return await this.getPaymentByIdUseCase.execute(id);
    } catch (error) {
      this.handleError(error);
    }
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiNoContentResponse({
    description: 'Pago eliminado correctamente.',
  })
  @ApiNotFoundResponse({ description: 'Pago no encontrado.' })
  async delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    try {
      await this.deletePaymentUseCase.execute(id);
    } catch (error) {
      this.handleError(error);
    }
  }

  private handleError(error: unknown): never {
    if (error instanceof PaymentNotFoundError) {
      throw new NotFoundException({
        message: error.message,
        error:
          'Lo sentimos, no pudimos recuperar la informacion del pago. Intente nuevamente.',
      });
    }

    if (error instanceof ReservationNotFoundError) {
      throw new NotFoundException({
        message: error.message,
        error:
          'Lo sentimos, no pudimos recuperar la informacion de la reserva. Intente nuevamente.',
      });
    }

    throw error;
  }
}
