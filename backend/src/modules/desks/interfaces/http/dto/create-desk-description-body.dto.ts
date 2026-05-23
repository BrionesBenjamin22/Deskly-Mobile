import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateDeskDescriptionBodyDto {
  @ApiProperty({ example: 'Escritorio individual' })
  @IsString({ message: 'El nombre debe ser texto.' })
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  @MaxLength(120, { message: 'El nombre no puede superar los 120 caracteres.' })
  name!: string;

  @ApiPropertyOptional({ example: 'Escritorio con silla ergonomica.' })
  @IsOptional()
  @IsString({ message: 'La descripcion debe ser texto.' })
  @MaxLength(255, {
    message: 'La descripcion no puede superar los 255 caracteres.',
  })
  description?: string;

  @ApiProperty({ example: 1 })
  @IsInt({ message: 'La cantidad de personas debe ser un numero entero.' })
  @Min(1, { message: 'La cantidad de personas debe ser mayor o igual a 1.' })
  peopleCapacity!: number;
}
