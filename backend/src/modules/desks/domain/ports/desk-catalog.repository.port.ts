export const DESK_CATALOG_REPOSITORY = Symbol('DESK_CATALOG_REPOSITORY');

export type DeskDescriptionCatalogItem = {
  id: string;
  name: string;
  description?: string | null;
  peopleCapacity: number;
};

export type AmenityCatalogItem = {
  id: string;
  name: string;
};

export type CreateDeskDescriptionParams = {
  name: string;
  description?: string;
  peopleCapacity: number;
};

export type UpdateDeskDescriptionParams = {
  id: string;
  name?: string;
  description?: string | null;
  peopleCapacity?: number;
};

export type CreateAmenityParams = {
  name: string;
};

export type UpdateAmenityParams = {
  id: string;
  name?: string;
};

export interface DeskCatalogRepositoryPort {
  listDescriptions(): Promise<DeskDescriptionCatalogItem[]>;
  findDescriptionById(id: string): Promise<DeskDescriptionCatalogItem | null>;
  createDescription(
    params: CreateDeskDescriptionParams,
  ): Promise<DeskDescriptionCatalogItem>;
  updateDescription(
    params: UpdateDeskDescriptionParams,
  ): Promise<DeskDescriptionCatalogItem>;
  deleteDescription(id: string): Promise<void>;
  listAmenities(): Promise<AmenityCatalogItem[]>;
  findAmenityById(id: string): Promise<AmenityCatalogItem | null>;
  createAmenity(params: CreateAmenityParams): Promise<AmenityCatalogItem>;
  updateAmenity(params: UpdateAmenityParams): Promise<AmenityCatalogItem>;
  deleteAmenity(id: string): Promise<void>;
}
