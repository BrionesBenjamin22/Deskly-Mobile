import { ApiProperty } from '@nestjs/swagger';

export class PaymentResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Identificador unico del pago',
  })
  paymentId: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440001',
    description: 'Identificador de la reserva',
  })
  reservationId: string;

  @ApiProperty({
    example: '2026-06-22',
    description: 'Fecha del pago',
  })
  date: string;

  @ApiProperty({
    example: 100.5,
    description: 'Monto pagado',
  })
  amount: number;

  @ApiProperty({
    description: 'Fecha de creacion',
  })
  createdAt?: Date;

  @ApiProperty({
    description: 'Fecha de actualizacion',
  })
  updatedAt?: Date;
}
