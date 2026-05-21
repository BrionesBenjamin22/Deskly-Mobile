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

export type DeskProperties = {
  id: string;
  code: string;
  name?: string | null;
  descriptionId?: string | null;
  description?: DeskDescriptionProperties | null;
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

  get descriptionId(): string | null | undefined {
    return this.properties.descriptionId;
  }

  get description(): DeskDescriptionProperties | null | undefined {
    return this.properties.description;
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
