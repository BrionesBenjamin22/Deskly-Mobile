import { PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateWorkAreaBodyDto {
  @IsString({ message: 'El nombre debe ser texto.' })
  @MaxLength(120, { message: 'El nombre no puede superar los 120 caracteres.' })
  name!: string;

  @IsUUID('4', { message: 'La localidad debe ser un UUID valido.' })
  localityId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @IsOptional()
  @IsNumber({}, { message: 'La latitud debe ser numerica.' })
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @IsNumber({}, { message: 'La longitud debe ser numerica.' })
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateWorkAreaBodyDto extends PartialType(CreateWorkAreaBodyDto) {}
