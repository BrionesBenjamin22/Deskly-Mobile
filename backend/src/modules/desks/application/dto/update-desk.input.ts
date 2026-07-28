import { DeskZoneValue } from '../../domain/entities/desk.entity';

export type UpdateDeskInput = {
  id: string;
  name?: string | null;
  peopleCapacity?: number;
  descriptionId?: string | null;
  areaId?: string;
  zone?: DeskZoneValue | null;
  amenityIds?: string[];
  enabled?: boolean;
};
