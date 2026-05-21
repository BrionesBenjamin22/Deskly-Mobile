import {
  AmenityProperties,
  DeskDescriptionProperties,
  DeskZoneValue,
} from '../../domain/entities/desk.entity';

export type AvailableDeskOutput = {
  id: string;
  code: string;
  name?: string;
  descriptionId?: string;
  description?: DeskDescriptionProperties;
  zone?: DeskZoneValue;
  amenities: AmenityProperties[];
};

export type GetAvailableDesksOutput = {
  desks: AvailableDeskOutput[];
};
