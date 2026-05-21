import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

enum DeskZoneDto {
  A = 'A',
  B = 'B',
  C = 'C',
}

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

  @ApiPropertyOptional({ example: '7a3deca2-0063-4e6c-b1ee-a95666b5efdc' })
  @IsOptional()
  @IsUUID('4', { message: 'La descripcion debe ser un UUID valido.' })
  descriptionId?: string;

  @ApiPropertyOptional({
    example: 'A',
    enum: DeskZoneDto,
    description: 'Zona de ubicacion del escritorio dentro de la oficina.',
  })
  @IsOptional()
  @IsEnum(DeskZoneDto, { message: 'La zona debe ser A, B o C.' })
  zone?: DeskZoneDto;

  @ApiPropertyOptional({
    example: ['7a3deca2-0063-4e6c-b1ee-a95666b5efdc'],
    description: 'Activos asociados al escritorio.',
  })
  @IsOptional()
  @IsUUID('4', {
    each: true,
    message: 'Cada amenity debe ser un UUID valido.',
  })
  @ArrayUnique({ message: 'Los amenities no pueden repetirse.' })
  amenityIds?: string[];

  @ApiPropertyOptional({
    example: true,
    description: 'Indica si el escritorio puede reservarse.',
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'El campo enabled debe ser verdadero o falso.' })
  enabled?: boolean;
}
