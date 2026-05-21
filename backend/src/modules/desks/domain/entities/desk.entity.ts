export type DeskProperties = {
  id: string;
  code: string;
  name?: string | null;
  locationDescription?: string | null;
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

  get locationDescription(): string | null | undefined {
    return this.properties.locationDescription;
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
