import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import {
  AmenityCatalogItem,
  CreateAmenityParams,
  CreateDeskDescriptionParams,
  DeskCatalogRepositoryPort,
  DeskDescriptionCatalogItem,
  UpdateAmenityParams,
  UpdateDeskDescriptionParams,
} from '../../domain/ports/desk-catalog.repository.port';
import { DeskCatalogItemInUseError } from '../../domain/errors/desk-catalog-item-in-use.error';

const deskDescriptionSelect = {
  id: true,
  name: true,
  description: true,
  peopleCapacity: true,
};

const amenitySelect = {
  id: true,
  name: true,
};

@Injectable()
export class PrismaDeskCatalogRepository implements DeskCatalogRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async listDescriptions(): Promise<DeskDescriptionCatalogItem[]> {
    return this.prisma.deskDescription.findMany({
      orderBy: {
        name: 'asc',
      },
      select: deskDescriptionSelect,
    });
  }

  async findDescriptionById(
    id: string,
  ): Promise<DeskDescriptionCatalogItem | null> {
    return this.prisma.deskDescription.findUnique({
      where: { id },
      select: deskDescriptionSelect,
    });
  }

  async createDescription(
    params: CreateDeskDescriptionParams,
  ): Promise<DeskDescriptionCatalogItem> {
    return this.prisma.deskDescription.create({
      data: params,
      select: deskDescriptionSelect,
    });
  }

  async updateDescription(
    params: UpdateDeskDescriptionParams,
  ): Promise<DeskDescriptionCatalogItem> {
    const { id, ...data } = params;

    return this.prisma.deskDescription.update({
      where: { id },
      data,
      select: deskDescriptionSelect,
    });
  }

  async deleteDescription(id: string): Promise<void> {
    try {
      await this.prisma.deskDescription.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('Foreign key')) {
        throw new DeskCatalogItemInUseError();
      }

      throw error;
    }
  }

  async listAmenities(): Promise<AmenityCatalogItem[]> {
    return this.prisma.amenity.findMany({
      orderBy: {
        name: 'asc',
      },
      select: amenitySelect,
    });
  }

  async findAmenityById(id: string): Promise<AmenityCatalogItem | null> {
    return this.prisma.amenity.findUnique({
      where: { id },
      select: amenitySelect,
    });
  }

  async createAmenity(
    params: CreateAmenityParams,
  ): Promise<AmenityCatalogItem> {
    return this.prisma.amenity.create({
      data: params,
      select: amenitySelect,
    });
  }

  async updateAmenity(
    params: UpdateAmenityParams,
  ): Promise<AmenityCatalogItem> {
    const { id, ...data } = params;

    return this.prisma.amenity.update({
      where: { id },
      data,
      select: amenitySelect,
    });
  }

  async deleteAmenity(id: string): Promise<void> {
    try {
      await this.prisma.amenity.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('Foreign key')) {
        throw new DeskCatalogItemInUseError();
      }

      throw error;
    }
  }
}
