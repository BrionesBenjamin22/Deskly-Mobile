import type { Desk, Locality, WorkArea } from '../types/desk.types';

export function buildLocality(overrides: Partial<Locality> = {}): Locality {
  return {
    id: 'locality-1',
    name: 'Sede Centro',
    active: true,
    ...overrides,
  };
}

export function buildWorkArea(overrides: Partial<WorkArea> = {}): WorkArea {
  const locality = overrides.locality ?? buildLocality();

  return {
    id: 'area-1',
    name: 'Sala Norte',
    description: 'Espacio compartido y silencioso.',
    localityId: locality.id,
    locality,
    active: true,
    availableDeskCount: 2,
    totalDeskCount: 4,
    ...overrides,
  };
}

export function buildDesk(overrides: Partial<Desk> = {}): Desk {
  const area = overrides.area ?? buildWorkArea();

  return {
    id: 'desk-1',
    code: 'ESC-001',
    name: 'Escritorio Norte 1',
    peopleCapacity: 1,
    areaId: area.id,
    area,
    zone: 'A',
    amenities: [],
    enabled: true,
    status: 'available',
    reservedSlots: [],
    ...overrides,
  };
}
