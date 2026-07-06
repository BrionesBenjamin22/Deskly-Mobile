import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

enum DeskZoneDto {
  A = 'A',
  B = 'B',
  C = 'C',
}

export class CreateDeskBodyDto {
  @ApiPropertyOptional({
    example: 'Escritorio 1',
    description: 'Nombre descriptivo del escritorio.',
  })
  @IsOptional()
  @IsString({ message: 'El nombre debe ser texto.' })
  @MaxLength(120, { message: 'El nombre no puede superar los 120 caracteres.' })
  name?: string;

  @ApiPropertyOptional({
    example: 2,
    description: 'Cantidad de personas permitidas en el escritorio.',
    default: 1,
  })
  @IsOptional()
  @IsInt({ message: 'La cantidad de personas debe ser un numero entero.' })
  @Min(1, { message: 'La cantidad de personas debe ser mayor o igual a 1.' })
  peopleCapacity?: number;

  @ApiPropertyOptional({ example: '7a3deca2-0063-4e6c-b1ee-a95666b5efdc' })
  @IsOptional()
  @IsUUID('4', { message: 'La descripcion debe ser un UUID valido.' })
  descriptionId?: string;

  @ApiPropertyOptional({ example: '7a3deca2-0063-4e6c-b1ee-a95666b5efdc' })
  @IsOptional()
  @IsUUID('4', { message: 'El area de trabajo debe ser un UUID valido.' })
  areaId?: string;

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
    description: 'Amenities asociados al escritorio.',
  })
  @IsOptional()
  @IsArray({ message: 'Los amenities deben enviarse como una lista.' })
  @IsUUID('4', {
    each: true,
    message: 'Cada amenities debe ser un UUID valido.',
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
