export type WorkAreaLocationProperties = {
  address?: string;
  locationReference?: string;
  latitude?: number;
  longitude?: number;
};

export class WorkAreaLocation {
  private constructor(
    private readonly properties: WorkAreaLocationProperties,
  ) {}

  static create(properties: WorkAreaLocationProperties): WorkAreaLocation {
    const hasLatitude = properties.latitude !== undefined;
    const hasLongitude = properties.longitude !== undefined;

    if (hasLatitude !== hasLongitude) {
      throw new Error('Latitude and longitude must be provided together.');
    }

    if (hasLatitude && hasLongitude) {
      if (
        !Number.isFinite(properties.latitude) ||
        (properties.latitude as number) < -90 ||
        (properties.latitude as number) > 90
      ) {
        throw new Error('Latitude must be between -90 and 90.');
      }

      if (
        !Number.isFinite(properties.longitude) ||
        (properties.longitude as number) < -180 ||
        (properties.longitude as number) > 180
      ) {
        throw new Error('Longitude must be between -180 and 180.');
      }
    }

    return new WorkAreaLocation({
      ...WorkAreaLocation.optionalText('address', properties.address),
      ...WorkAreaLocation.optionalText(
        'locationReference',
        properties.locationReference,
      ),
      ...(hasLatitude && hasLongitude
        ? {
            latitude: properties.latitude,
            longitude: properties.longitude,
          }
        : {}),
    });
  }

  get address(): string | undefined {
    return this.properties.address;
  }

  get locationReference(): string | undefined {
    return this.properties.locationReference;
  }

  get latitude(): number | undefined {
    return this.properties.latitude;
  }

  get longitude(): number | undefined {
    return this.properties.longitude;
  }

  toPrimitives(): WorkAreaLocationProperties {
    return { ...this.properties };
  }

  private static optionalText<Key extends 'address' | 'locationReference'>(
    key: Key,
    value: string | undefined,
  ): Partial<Pick<WorkAreaLocationProperties, Key>> {
    const normalizedValue = value?.trim();

    return normalizedValue
      ? ({ [key]: normalizedValue } as Pick<WorkAreaLocationProperties, Key>)
      : {};
  }
}
