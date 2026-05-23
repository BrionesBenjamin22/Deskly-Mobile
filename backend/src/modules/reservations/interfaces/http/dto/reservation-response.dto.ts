import { ApiProperty } from '@nestjs/swagger';

export class ReservationResponseDto {
  @ApiProperty({ example: '2d7e9fb5-f93d-4143-a820-a7ad5ac7fcb4' })
  reservationId!: string;

  @ApiProperty({ example: '7a3deca2-0063-4e6c-b1ee-a95666b5efdc' })
  deskId!: string;

  @ApiProperty({ example: 'D-01' })
  deskCode!: string;

  @ApiProperty({ example: 'Escritorio 1', required: false })
  deskName?: string;

  @ApiProperty({ example: '2026-06-01' })
  date!: string;

  @ApiProperty({ example: '09:00' })
  startTime!: string;

  @ApiProperty({ example: '13:00' })
  endTime!: string;

  @ApiProperty({ example: 'ACTIVE', enum: ['ACTIVE', 'CANCELLED'] })
  status!: 'ACTIVE' | 'CANCELLED';

  @ApiProperty({ example: '2026-05-21T10:00:00.000Z', required: false })
  createdAt?: string;

  @ApiProperty({ example: '2026-05-21T10:00:00.000Z', required: false })
  updatedAt?: string;

  @ApiProperty({ example: '2026-05-21T10:30:00.000Z', required: false })
  cancelledAt?: string;
}
