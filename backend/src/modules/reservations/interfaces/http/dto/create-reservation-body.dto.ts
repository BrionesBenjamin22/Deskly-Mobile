import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID, Matches } from 'class-validator';

export class CreateReservationBodyDto {
  @ApiProperty({
    example: '7a3deca2-0063-4e6c-b1ee-a95666b5efdc',
    description: 'Identificador UUID del escritorio a reservar.',
  })
  @IsUUID('4', { message: 'El escritorio debe ser un UUID valido.' })
  @IsNotEmpty({ message: 'El escritorio es obligatorio.' })
  deskId!: string;

  @ApiProperty({
    example: '2026-06-01',
    description: 'Fecha de reserva en formato YYYY-MM-DD.',
  })
  @IsNotEmpty({ message: 'La fecha es obligatoria.' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'La fecha debe tener formato YYYY-MM-DD.',
  })
  date!: string;

  @ApiProperty({
    example: '09:00',
    description: 'Horario de inicio en formato HH:mm.',
  })
  @IsNotEmpty({ message: 'El horario de inicio es obligatorio.' })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'El horario de inicio debe tener formato HH:mm.',
  })
  startTime!: string;

  @ApiProperty({
    example: '13:00',
    description: 'Horario de fin en formato HH:mm.',
  })
  @IsNotEmpty({ message: 'El horario de fin es obligatorio.' })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'El horario de fin debe tener formato HH:mm.',
  })
  endTime!: string;
}
