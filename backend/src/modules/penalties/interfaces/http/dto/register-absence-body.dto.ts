import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class RegisterAbsenceBodyDto {
  @IsUUID()
  reservationId: string;

  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason: string;
}
