import {
  BadRequestException,
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import type { AuthenticatedRequest } from '../../../auth/interfaces/http/auth-request';
import { JwtAuthGuard } from '../../../auth/interfaces/http/guards/jwt-auth.guard';
import { ListPaymentSummariesUseCase } from '../../application/use-cases/list-payment-summaries.use-case';
import { paymentUserTracker } from './payments.controller';
import { ListPaymentSummariesQueryDto } from './dto/list-payment-summaries-query.dto';

@ApiTags('Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ThrottlerGuard)
@Controller('payments')
export class PaymentSummariesController {
  constructor(private readonly summaries: ListPaymentSummariesUseCase) {}

  @Get('summary')
  @Throttle({
    default: {
      limit: 30,
      ttl: 60_000,
      getTracker: paymentUserTracker,
    },
  })
  @ApiOkResponse({
    description:
      'Resumen paginado y autoritativo de pagos del miembro autenticado.',
  })
  async list(
    @Query() query: ListPaymentSummariesQueryDto,
    @Req() request: AuthenticatedRequest,
  ) {
    if (!request.user.member)
      throw new BadRequestException({
        message: 'El usuario no posee un miembro asociado.',
        error:
          'Lo sentimos, complete sus datos de miembro e intente nuevamente.',
      });
    return this.summaries.execute(
      request.user.member.id,
      query.page,
      query.limit,
    );
  }
}
