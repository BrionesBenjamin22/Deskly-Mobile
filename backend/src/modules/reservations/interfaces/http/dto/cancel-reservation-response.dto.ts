import { ApiProperty } from '@nestjs/swagger';

export class CancelReservationResponseDto {
  @ApiProperty({ example: '2d7e9fb5-f93d-4143-a820-a7ad5ac7fcb4' })
  reservationId!: string;

  @ApiProperty({ example: 'CANCELLED' })
  status!: 'CANCELLED';

  @ApiProperty({ example: '2026-06-01T10:30:00.000Z' })
  cancelledAt!: string;
}
