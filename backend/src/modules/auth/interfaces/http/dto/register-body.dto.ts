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
  dni!: number;

  @IsInt()
  @IsPositive()
  @Max(2147483647)
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
