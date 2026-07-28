export type WorkAreaLocationProperties = {
  address?: string;
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
      ...WorkAreaLocation.optionalAddress(properties.address),
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

  get latitude(): number | undefined {
    return this.properties.latitude;
  }

  get longitude(): number | undefined {
    return this.properties.longitude;
  }

  toPrimitives(): WorkAreaLocationProperties {
    return { ...this.properties };
  }

  private static optionalAddress(
    value: string | undefined,
  ): Pick<WorkAreaLocationProperties, 'address'> | Record<string, never> {
    const normalizedValue = value?.trim();

    return normalizedValue ? { address: normalizedValue } : {};
  }
}
