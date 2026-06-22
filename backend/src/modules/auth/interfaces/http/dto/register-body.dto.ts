import { Type } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, IsString, Length, Matches, ValidateNested } from 'class-validator';

export class RegisterMemberBodyDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  lastName!: string;
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
