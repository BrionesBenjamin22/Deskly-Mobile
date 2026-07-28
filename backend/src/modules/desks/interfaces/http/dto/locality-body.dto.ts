import { PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateLocalityBodyDto {
  @IsString({ message: 'El nombre debe ser texto.' })
  @MaxLength(120, { message: 'El nombre no puede superar los 120 caracteres.' })
  name!: string;

  @IsOptional()
  @IsBoolean({ message: 'El estado debe ser verdadero o falso.' })
  active?: boolean;
}

export class UpdateLocalityBodyDto extends PartialType(CreateLocalityBodyDto) {}
