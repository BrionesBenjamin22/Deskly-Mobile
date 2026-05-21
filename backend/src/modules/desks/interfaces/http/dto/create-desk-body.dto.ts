import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateDeskBodyDto {
  @ApiProperty({
    example: 'D-01',
    description: 'Codigo visible y unico del escritorio.',
  })
  @IsString({ message: 'El codigo debe ser texto.' })
  @IsNotEmpty({ message: 'El codigo es obligatorio.' })
  @MaxLength(30, { message: 'El codigo no puede superar los 30 caracteres.' })
  code!: string;

  @ApiPropertyOptional({
    example: 'Escritorio 1',
    description: 'Nombre descriptivo del escritorio.',
  })
  @IsOptional()
  @IsString({ message: 'El nombre debe ser texto.' })
  @MaxLength(120, { message: 'El nombre no puede superar los 120 caracteres.' })
  name?: string;

  @ApiPropertyOptional({
    example: 'Sector principal',
    description: 'Ubicacion o descripcion del sector.',
  })
  @IsOptional()
  @IsString({ message: 'La ubicacion debe ser texto.' })
  @MaxLength(255, {
    message: 'La ubicacion no puede superar los 255 caracteres.',
  })
  locationDescription?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Indica si el escritorio puede reservarse.',
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'El campo enabled debe ser verdadero o falso.' })
  enabled?: boolean;
}
