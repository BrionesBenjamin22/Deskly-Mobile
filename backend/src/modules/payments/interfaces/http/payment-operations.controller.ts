import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { Roles } from '../../../auth/interfaces/http/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../auth/interfaces/http/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/interfaces/http/guards/roles.guard';
import { ReconcileStalePaymentsUseCase } from '../../application/use-cases/reconcile-stale-payments.use-case';
import { ReconcilePaymentsBodyDto } from './dto/reconcile-payments-body.dto';

@ApiTags('Payment operations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'GESTOR')
@Controller('payments/operations')
export class PaymentOperationsController {
  constructor(private readonly reconciliation: ReconcileStalePaymentsUseCase) {}

  @Post('reconcile')
  @ApiOkResponse({
    description: 'Lote acotado de pagos pendientes conciliado.',
  })
  reconcile(@Body() body: ReconcilePaymentsBodyDto) {
    return this.reconciliation.execute(body);
  }
}
