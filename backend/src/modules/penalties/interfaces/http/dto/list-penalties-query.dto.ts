import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class ListPenaltiesQueryDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page = 1;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  limit = 9;

  @IsOptional()
  @IsUUID()
  memberId?: string;
}
