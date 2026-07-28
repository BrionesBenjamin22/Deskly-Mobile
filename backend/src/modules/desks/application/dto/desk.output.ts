import {
  AmenityProperties,
  DeskDescriptionProperties,
  DeskZoneValue,
  WorkAreaProperties,
} from '../../domain/entities/desk.entity';

export type DeskOutput = {
  id: string;
  code: string;
  name?: string;
  peopleCapacity: number;
  descriptionId?: string;
  description?: DeskDescriptionProperties;
  areaId?: string;
  area?: WorkAreaProperties;
  zone?: DeskZoneValue;
  amenities: AmenityProperties[];
  enabled: boolean;
  createdAt?: string;
  updatedAt?: string;
};
