import { DeskZoneValue } from '../../domain/entities/desk.entity';

export type CreateDeskInput = {
  name?: string;
  peopleCapacity?: number;
  descriptionId?: string;
  zone?: DeskZoneValue;
  amenityIds?: string[];
  enabled?: boolean;
};
