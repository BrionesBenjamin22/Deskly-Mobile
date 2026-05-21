import { Desk } from '../entities/desk.entity';

export const DESK_REPOSITORY = Symbol('DESK_REPOSITORY');

export type FindAvailableDesksParams = {
  date: string;
  startTime: string;
  endTime: string;
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
  code: string;
  name?: string;
  locationDescription?: string;
  enabled: boolean;
};

export type UpdateDeskParams = {
  id: string;
  code?: string;
  name?: string | null;
  locationDescription?: string | null;
  enabled?: boolean;
};

export interface DeskRepositoryPort {
  findAvailableByTimeSlot(params: FindAvailableDesksParams): Promise<Desk[]>;
  list(params: ListDesksParams): Promise<ListDesksResult>;
  findById(id: string): Promise<Desk | null>;
  findByCode(code: string): Promise<Desk | null>;
  create(params: CreateDeskParams): Promise<Desk>;
  update(params: UpdateDeskParams): Promise<Desk>;
  softDelete(id: string): Promise<void>;
}
