import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateAmenityBodyDto {
  @ApiProperty({ example: 'Monitor' })
  @IsString({ message: 'El nombre debe ser texto.' })
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  @MaxLength(120, { message: 'El nombre no puede superar los 120 caracteres.' })
  name!: string;
}
