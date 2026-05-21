import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID, Matches } from 'class-validator';

export class UpdateReservationBodyDto {
  @ApiPropertyOptional({
    example: '7a3deca2-0063-4e6c-b1ee-a95666b5efdc',
  })
  @IsOptional()
  @IsUUID('4', { message: 'El escritorio debe ser un UUID valido.' })
  deskId?: string;

  @ApiPropertyOptional({ example: '2026-06-01' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'La fecha debe tener formato YYYY-MM-DD.',
  })
  date?: string;

  @ApiPropertyOptional({ example: '09:00' })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'El horario de inicio debe tener formato HH:mm.',
  })
  startTime?: string;

  @ApiPropertyOptional({ example: '13:00' })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'El horario de fin debe tener formato HH:mm.',
  })
  endTime?: string;
}
