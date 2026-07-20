import { IsIn, IsUUID } from 'class-validator';
import type { PaymentOption } from '../../../domain/services/payment-pricing-policy';

export class CreatePaymentBodyDto {
  @IsUUID()
  reservationId: string;

  @IsIn(['DEPOSIT', 'FULL'])
  option: PaymentOption;
}
