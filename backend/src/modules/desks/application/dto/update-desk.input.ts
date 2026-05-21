import { DeskZoneValue } from '../../domain/entities/desk.entity';

export type UpdateDeskInput = {
  id: string;
  code?: string;
  name?: string | null;
  descriptionId?: string | null;
  zone?: DeskZoneValue | null;
  amenityIds?: string[];
  enabled?: boolean;
};
