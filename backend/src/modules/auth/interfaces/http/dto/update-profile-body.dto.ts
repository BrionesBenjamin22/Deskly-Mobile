import { Type } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  Length,
  Matches,
  Max,
} from 'class-validator';

export class UpdateProfileBodyDto {
  @IsOptional()
  @IsEmail()
  @Length(3, 255)
  email?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9._-]+$/)
  @Length(3, 60)
  username?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  fullName?: string;

  @IsOptional()
  @IsInt({ message: 'El teléfono debe contener solo números.' })
  @IsPositive({ message: 'El teléfono debe ser mayor que cero.' })
  @Max(Number.MAX_SAFE_INTEGER, {
    message: 'El teléfono supera la longitud permitida.',
  })
  @Type(() => Number)
  phone?: number;
}
