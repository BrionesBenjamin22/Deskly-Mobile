import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DeskResponseDto {
  @ApiProperty({ example: '7a3deca2-0063-4e6c-b1ee-a95666b5efdc' })
  id!: string;

  @ApiProperty({ example: 'D-01' })
  code!: string;

  @ApiPropertyOptional({ example: 'Escritorio 1' })
  name?: string;

  @ApiPropertyOptional({ example: 'Sector principal' })
  locationDescription?: string;

  @ApiProperty({ example: true })
  enabled!: boolean;

  @ApiPropertyOptional({ example: '2026-05-21T10:00:00.000Z' })
  createdAt?: string;

  @ApiPropertyOptional({ example: '2026-05-21T10:00:00.000Z' })
  updatedAt?: string;
}
