import { WorkAreaLocation } from './work-area-location.vo';

describe('WorkAreaLocation', () => {
  it('accepts an optional address without coordinates', () => {
    const location = WorkAreaLocation.create({
      address: 'Av. Costanera Espana 120',
    });

    expect(location.address).toBe('Av. Costanera Espana 120');
    expect(location.latitude).toBeUndefined();
    expect(location.longitude).toBeUndefined();
  });

  it.each([
    { latitude: -90, longitude: -180 },
    { latitude: 90, longitude: 180 },
  ])(
    'accepts geographic boundary coordinates ($latitude, $longitude)',
    ({ latitude, longitude }) => {
      const location = WorkAreaLocation.create({ latitude, longitude });

      expect(location.latitude).toBe(latitude);
      expect(location.longitude).toBe(longitude);
    },
  );

  it.each([-90.0001, 90.0001])(
    'rejects latitude outside its valid range: %s',
    (latitude) => {
      expect(() => WorkAreaLocation.create({ latitude, longitude: 0 })).toThrow(
        'Latitude must be between -90 and 90.',
      );
    },
  );

  it.each([-180.0001, 180.0001])(
    'rejects longitude outside its valid range: %s',
    (longitude) => {
      expect(() => WorkAreaLocation.create({ latitude: 0, longitude })).toThrow(
        'Longitude must be between -180 and 180.',
      );
    },
  );

  it.each([
    { latitude: -35.577, longitude: undefined },
    { latitude: undefined, longitude: -57.997 },
  ])('rejects partial coordinates: %o', (coordinates) => {
    expect(() => WorkAreaLocation.create(coordinates)).toThrow(
      'Latitude and longitude must be provided together.',
    );
  });
});
