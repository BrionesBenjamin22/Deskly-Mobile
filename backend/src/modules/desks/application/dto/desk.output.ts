import {
  AmenityProperties,
  DeskDescriptionProperties,
  DeskZoneValue,
} from '../../domain/entities/desk.entity';

export type DeskOutput = {
  id: string;
  code: string;
  name?: string;
  descriptionId?: string;
  description?: DeskDescriptionProperties;
  zone?: DeskZoneValue;
  amenities: AmenityProperties[];
  enabled: boolean;
  createdAt?: string;
  updatedAt?: string;
};
