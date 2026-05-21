import { PartialType } from '@nestjs/swagger';

import { CreateAmenityBodyDto } from './create-amenity-body.dto';

export class UpdateAmenityBodyDto extends PartialType(CreateAmenityBodyDto) {}
