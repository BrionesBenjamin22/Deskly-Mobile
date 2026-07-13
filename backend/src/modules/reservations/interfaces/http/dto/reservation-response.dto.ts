import { ApiProperty } from '@nestjs/swagger';

export class ReservationLocationResponseDto {
  @ApiProperty({ example: '30000000-0000-4000-8000-000000000001' })
  areaId!: string;

  @ApiProperty({ example: 'Area abierta' })
  areaName!: string;

  @ApiProperty({ example: '20000000-0000-4000-8000-000000000001' })
  localityId!: string;

  @ApiProperty({ example: 'Chascomus' })
  localityName!: string;
}

export class ReservationResponseDto {
  @ApiProperty({ example: '2d7e9fb5-f93d-4143-a820-a7ad5ac7fcb4' })
  reservationId!: string;

  @ApiProperty({ example: '7a3deca2-0063-4e6c-b1ee-a95666b5efdc' })
  deskId!: string;

  @ApiProperty({ example: '8ae2e38a-300c-4cc1-b6ba-cee270f163f7' })
  memberId!: string;

  @ApiProperty({ example: 'Nombre Apellido', required: false })
  memberFullName?: string;

  @ApiProperty({ example: 'D-01' })
  deskCode!: string;

  @ApiProperty({ example: 'Escritorio 1', required: false })
  deskName?: string;

  @ApiProperty({
    type: ReservationLocationResponseDto,
    required: false,
    description:
      'Area de trabajo y localidad cargadas junto con la reserva. Puede omitirse en respuestas de transicion.',
  })
  location?: ReservationLocationResponseDto;

  @ApiProperty({ example: '2026-06-01' })
  date!: string;

  @ApiProperty({ example: '09:00' })
  startTime!: string;

  @ApiProperty({ example: '13:00' })
  endTime!: string;

  @ApiProperty({
    example: 'RESERVED',
    enum: ['RESERVED', 'ACTIVE', 'COMPLETED', 'CANCELLED'],
  })
  status!: 'RESERVED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

  @ApiProperty({ example: '2026-05-21T10:00:00.000Z', required: false })
  createdAt?: string;

  @ApiProperty({ example: '2026-05-21T10:00:00.000Z', required: false })
  updatedAt?: string;

  @ApiProperty({ example: '2026-05-21T10:30:00.000Z', required: false })
  cancelledAt?: string;

  @ApiProperty({ example: '2026-06-23T12:05:00.000Z', required: false })
  checkedInAt?: string;
}
