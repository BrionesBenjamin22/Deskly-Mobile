import { Type } from 'class-transformer';
import { IsEnum, IsInt, Max, Min } from 'class-validator';

export enum PaymentSummaryFilter {
  ALL = 'ALL',
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
}

export class ListPaymentSummariesQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(9)
  limit = 9;

  @IsEnum(PaymentSummaryFilter)
  filter: PaymentSummaryFilter = PaymentSummaryFilter.ALL;
}
