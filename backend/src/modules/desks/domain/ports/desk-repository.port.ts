import {
  Desk,
  DeskZoneValue,
  LocalityProperties,
  WorkAreaProperties,
} from '../entities/desk.entity';

export const DESK_REPOSITORY = Symbol('DESK_REPOSITORY');

export type FindAvailableDesksParams = {
  date: string;
  startTime: string;
  endTime: string;
  zone?: DeskZoneValue;
  areaId?: string;
  localityId?: string;
};

export type DeskReservedSlot = {
  startTime: string;
  endTime: string;
};

export type DeskAvailabilityResult = {
  desk: Desk;
  reservedSlots: DeskReservedSlot[];
};

export type ListDesksParams = {
  page: number;
  limit: number;
};

export type ListDesksResult = {
  desks: Desk[];
  total: number;
};

export type CreateDeskParams = {
  name?: string;
  peopleCapacity?: number;
  descriptionId?: string;
  areaId?: string;
  zone?: DeskZoneValue;
  amenityIds?: string[];
  enabled: boolean;
};

export type UpdateDeskParams = {
  id: string;
  name?: string | null;
  peopleCapacity?: number;
  descriptionId?: string | null;
  areaId?: string;
  zone?: DeskZoneValue | null;
  amenityIds?: string[];
  enabled?: boolean;
};

export type ListWorkAreasParams = {
  localityId?: string;
  activeOnly?: boolean;
};

export type WorkAreaAvailabilityResult = {
  area: WorkAreaProperties;
  availableDeskCount: number;
  totalDeskCount: number;
};

export interface DeskRepositoryPort {
  findAvailableByTimeSlot(
    params: FindAvailableDesksParams,
  ): Promise<DeskAvailabilityResult[]>;
  list(params: ListDesksParams): Promise<ListDesksResult>;
  findById(id: string): Promise<Desk | null>;
  findByName(name: string, excludeId?: string): Promise<Desk | null>;
  create(params: CreateDeskParams): Promise<Desk>;
  update(params: UpdateDeskParams): Promise<Desk>;
  softDelete(id: string): Promise<void>;
  listLocalities(activeOnly?: boolean): Promise<LocalityProperties[]>;
  listWorkAreas(params: ListWorkAreasParams): Promise<WorkAreaProperties[]>;
  findWorkAreaById(id: string): Promise<WorkAreaProperties | null>;
  findAvailableWorkAreasByTimeSlot(
    params: FindAvailableDesksParams,
  ): Promise<WorkAreaAvailabilityResult[]>;
}
