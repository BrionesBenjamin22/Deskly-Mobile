import { PartialType } from '@nestjs/swagger';

import { CreateDeskBodyDto } from './create-desk-body.dto';

export class UpdateDeskBodyDto extends PartialType(CreateDeskBodyDto) {}
