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
  ValidateNested,
} from 'class-validator';

export class RegisterMemberBodyDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  fullName!: string;

  @IsInt()
  @IsPositive()
  @Max(2147483647)
  @Type(() => Number)
  dni!: number;

  @IsInt({ message: 'El teléfono debe contener solo números.' })
  @IsPositive({ message: 'El teléfono debe ser mayor que cero.' })
  @Max(Number.MAX_SAFE_INTEGER, {
    message: 'El teléfono supera la longitud permitida.',
  })
  @Type(() => Number)
  phone!: number;
}

export class RegisterBodyDto {
  @IsEmail()
  @Length(3, 255)
  email!: string;

  @IsString()
  @Matches(/^[a-zA-Z0-9._-]+$/)
  @Length(3, 60)
  username!: string;

  @IsString()
  @Length(8, 72)
  password!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => RegisterMemberBodyDto)
  member?: RegisterMemberBodyDto;
}
