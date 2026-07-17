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

export interface Locality {
  id: string;
  name: string;
  active: boolean;
}

export interface WorkArea {
  id: string;
  name: string;
  description?: string | null;
  localityId: string;
  locality?: Locality;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  active: boolean;
  availableDeskCount?: number;
  totalDeskCount?: number;
}

export interface Desk {
  id: string;
  code: string;
  name?: string;
  peopleCapacity: number;
  descriptionId?: string;
  description?: DeskDescription;
  areaId?: string;
  area?: WorkArea;
  zone?: DeskZone;
  amenities: DeskAmenity[];
  enabled: boolean;
  status: DeskStatus;
  reservedSlots?: {
    startTime: string;
    endTime: string;
  }[];
}
