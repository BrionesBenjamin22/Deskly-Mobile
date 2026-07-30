import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class RefreshTokenBodyDto {
  @ApiProperty({ description: 'Token de renovacion entregado por el login.' })
  @IsString()
  @MinLength(20)
  @MaxLength(4096)
  refreshToken!: string;
}
