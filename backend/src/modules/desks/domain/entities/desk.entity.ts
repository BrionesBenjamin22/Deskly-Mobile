export type DeskZoneValue = 'A' | 'B' | 'C';

export type DeskDescriptionProperties = {
  id: string;
  name: string;
  description?: string | null;
  peopleCapacity: number;
};

export type AmenityProperties = {
  id: string;
  name: string;
};

export type LocalityProperties = {
  id: string;
  name: string;
  active: boolean;
};

export type WorkAreaProperties = {
  id: string;
  name: string;
  description?: string | null;
  localityId: string;
  locality?: LocalityProperties;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  active: boolean;
};

export type DeskProperties = {
  id: string;
  code: string;
  name?: string | null;
  peopleCapacity: number;
  descriptionId?: string | null;
  description?: DeskDescriptionProperties | null;
  areaId?: string;
  area?: WorkAreaProperties;
  zone?: DeskZoneValue | null;
  amenities?: AmenityProperties[];
  enabled: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
};

export class Desk {
  constructor(private readonly properties: DeskProperties) {}

  get id(): string {
    return this.properties.id;
  }

  get code(): string {
    return this.properties.code;
  }

  get name(): string | null | undefined {
    return this.properties.name;
  }

  get peopleCapacity(): number {
    return this.properties.peopleCapacity;
  }

  get descriptionId(): string | null | undefined {
    return this.properties.descriptionId;
  }

  get description(): DeskDescriptionProperties | null | undefined {
    return this.properties.description;
  }

  get areaId(): string | undefined {
    return this.properties.areaId;
  }

  get area(): WorkAreaProperties | undefined {
    return this.properties.area;
  }

  get zone(): DeskZoneValue | null | undefined {
    return this.properties.zone;
  }

  get amenities(): AmenityProperties[] {
    return this.properties.amenities ?? [];
  }

  get enabled(): boolean {
    return this.properties.enabled;
  }

  get createdAt(): Date | undefined {
    return this.properties.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this.properties.updatedAt;
  }

  get deletedAt(): Date | null | undefined {
    return this.properties.deletedAt;
  }
}
