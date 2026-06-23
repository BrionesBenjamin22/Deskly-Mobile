import { IsOptional, IsUUID, Min, Max, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ListPaymentsQueryDto {
  @ApiPropertyOptional({
    example: 1,
    description: 'Numero de pagina',
  })
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({
    example: 9,
    description: 'Cantidad de items por pagina',
  })
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(50)
  limit: number = 9;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440001',
    description: 'Filtrar por identificador de reserva',
  })
  @IsOptional()
  @IsUUID()
  reservationId?: string;
}
