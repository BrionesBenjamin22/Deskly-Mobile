import { IsDateString, IsNumber, IsUUID, Matches, Min } from 'class-validator';

export class CreatePaymentBodyDto {
  @IsUUID()
  reservationId: string;

  @IsDateString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'La fecha debe tener formato YYYY-MM-DD.',
  })
  date: string;

  @IsNumber()
  @Min(0.01)
  amount: number;
}
