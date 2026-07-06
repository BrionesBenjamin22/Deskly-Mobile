import { IsOptional, IsUUID } from 'class-validator';

export class ListWorkAreasQueryDto {
  @IsOptional()
  @IsUUID('4', { message: 'La localidad debe ser un UUID valido.' })
  localityId?: string;
}
