import { DeskZoneValue } from '../../domain/entities/desk.entity';

export type CreateDeskInput = {
  code: string;
  name?: string;
  descriptionId?: string;
  zone?: DeskZoneValue;
  amenityIds?: string[];
  enabled?: boolean;
};
