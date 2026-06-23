import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

export class ListReservationsQueryDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La pagina debe ser un numero entero.' })
  @Min(1, { message: 'La pagina debe ser mayor o igual a 1.' })
  page?: number;

  @ApiPropertyOptional({ example: 9, default: 9 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El limite debe ser un numero entero.' })
  @Min(1, { message: 'El limite debe ser mayor o igual a 1.' })
  @Max(50, { message: 'El limite no puede superar 50.' })
  limit?: number;

  @ApiPropertyOptional({
    example: 'RESERVED',
    enum: ['RESERVED', 'ACTIVE', 'COMPLETED', 'CANCELLED'],
  })
  @IsOptional()
  @IsIn(['RESERVED', 'ACTIVE', 'COMPLETED', 'CANCELLED'], {
    message: 'El estado de la reserva no es valido.',
  })
  status?: 'RESERVED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

  @ApiPropertyOptional({ example: '2026-06-23' })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha debe tener formato ISO.' })
  date?: string;
}
