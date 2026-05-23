import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DeskResponseDto {
  @ApiProperty({ example: '7a3deca2-0063-4e6c-b1ee-a95666b5efdc' })
  id!: string;

  @ApiProperty({ example: 'D-01' })
  code!: string;

  @ApiPropertyOptional({ example: 'Escritorio 1' })
  name?: string;

  @ApiProperty({
    example: 2,
    description: 'Cantidad de personas permitidas en el escritorio.',
  })
  peopleCapacity!: number;

  @ApiPropertyOptional({ example: '7a3deca2-0063-4e6c-b1ee-a95666b5efdc' })
  descriptionId?: string;

  @ApiPropertyOptional({
    example: {
      id: '7a3deca2-0063-4e6c-b1ee-a95666b5efdc',
      name: 'Escritorio individual',
      description: 'Escritorio con silla ergonomica',
      peopleCapacity: 1,
    },
  })
  description?: {
    id: string;
    name: string;
    description?: string | null;
    peopleCapacity: number;
  };

  @ApiPropertyOptional({ example: 'A', enum: ['A', 'B', 'C'] })
  zone?: 'A' | 'B' | 'C';

  @ApiProperty({
    example: [
      {
        id: '7a3deca2-0063-4e6c-b1ee-a95666b5efdc',
        name: 'Monitor',
      },
    ],
  })
  amenities!: {
    id: string;
    name: string;
  }[];

  @ApiProperty({ example: true })
  enabled!: boolean;

  @ApiPropertyOptional({ example: '2026-05-21T10:00:00.000Z' })
  createdAt?: string;

  @ApiPropertyOptional({ example: '2026-05-21T10:00:00.000Z' })
  updatedAt?: string;
}
