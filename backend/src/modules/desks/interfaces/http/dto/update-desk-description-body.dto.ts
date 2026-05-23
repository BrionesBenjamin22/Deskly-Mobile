import { PartialType } from '@nestjs/swagger';

import { CreateDeskDescriptionBodyDto } from './create-desk-description-body.dto';

export class UpdateDeskDescriptionBodyDto extends PartialType(
  CreateDeskDescriptionBodyDto,
) {}
