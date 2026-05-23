import {
  AmenityProperties,
  DeskDescriptionProperties,
  DeskZoneValue,
} from '../../domain/entities/desk.entity';

export type AvailableDeskOutput = {
  id: string;
  code: string;
  name?: string;
  peopleCapacity: number;
  descriptionId?: string;
  description?: DeskDescriptionProperties;
  zone?: DeskZoneValue;
  amenities: AmenityProperties[];
  status: 'available' | 'unavailable';
  reservedSlots: {
    startTime: string;
    endTime: string;
  }[];
};

export type GetAvailableDesksOutput = {
  desks: AvailableDeskOutput[];
};
