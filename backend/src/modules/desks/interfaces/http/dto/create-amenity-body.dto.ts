import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

const AMENITY_NAME_PATTERN = /^(?=.*[A-Za-z])[A-Za-z0-9 ']+$/;

export class CreateAmenityBodyDto {
  @ApiProperty({ example: 'Monitor' })
  @IsString({ message: 'El nombre debe ser texto.' })
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  @Matches(AMENITY_NAME_PATTERN, {
    message: 'Ingrese un nombre valido para el amenity.',
  })
  @MaxLength(120, { message: 'El nombre no puede superar los 120 caracteres.' })
  name!: string;
}
