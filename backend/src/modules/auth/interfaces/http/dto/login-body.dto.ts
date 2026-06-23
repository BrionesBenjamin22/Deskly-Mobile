import { IsNotEmpty, IsString, Length } from 'class-validator';

export class LoginBodyDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 255)
  identifier!: string;

  @IsString()
  @Length(8, 72)
  password!: string;
}
