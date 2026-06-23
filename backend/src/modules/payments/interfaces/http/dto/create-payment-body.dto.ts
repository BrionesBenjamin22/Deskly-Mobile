import { IsDateString, IsNumber, IsUUID, Min } from 'class-validator';

export class CreatePaymentBodyDto {
  @IsUUID()
  reservationId: string;

  @IsDateString()
  date: string;

  @IsNumber()
  @Min(0.01)
  amount: number;
}
