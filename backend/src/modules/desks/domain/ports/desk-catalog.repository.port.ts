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

export type CreateAmenityParams = {
  name: string;
};

export interface DeskCatalogRepositoryPort {
  listDescriptions(): Promise<DeskDescriptionCatalogItem[]>;
  createDescription(
    params: CreateDeskDescriptionParams,
  ): Promise<DeskDescriptionCatalogItem>;
  listAmenities(): Promise<AmenityCatalogItem[]>;
  createAmenity(params: CreateAmenityParams): Promise<AmenityCatalogItem>;
}
