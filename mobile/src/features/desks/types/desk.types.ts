export type DeskZone = 'A' | 'B' | 'C';

export type DeskStatus = 'available' | 'unavailable' | 'reserved';

export interface DeskDescription {
  id: string;
  name: string;
  description?: string | null;
  peopleCapacity: number;
}

export interface DeskAmenity {
  id: string;
  name: string;
}

export interface Desk {
  id: string;
  code: string;
  name?: string;
  peopleCapacity: number;
  descriptionId?: string;
  description?: DeskDescription;
  zone?: DeskZone;
  amenities: DeskAmenity[];
  enabled: boolean;
  status: DeskStatus;
}
