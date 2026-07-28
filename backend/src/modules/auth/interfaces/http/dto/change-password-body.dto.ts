import { IsString, Length, Matches } from 'class-validator';

export class ChangePasswordBodyDto {
  @IsString()
  @Length(1, 72)
  currentPassword: string;

  @IsString()
  @Length(8, 72)
  @Matches(/^(?=.*[A-Z])(?=.*[0-9])/, {
    message:
      'La nueva contraseña debe tener al menos 8 caracteres, una mayúscula y un número.',
  })
  newPassword: string;
}
