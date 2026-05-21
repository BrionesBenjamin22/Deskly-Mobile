import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import {
  AmenityCatalogItem,
  CreateAmenityParams,
  CreateDeskDescriptionParams,
  DeskCatalogRepositoryPort,
  DeskDescriptionCatalogItem,
} from '../../domain/ports/desk-catalog.repository.port';

@Injectable()
export class PrismaDeskCatalogRepository implements DeskCatalogRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async listDescriptions(): Promise<DeskDescriptionCatalogItem[]> {
    return this.prisma.deskDescription.findMany({
      orderBy: {
        name: 'asc',
      },
      select: {
        id: true,
        name: true,
        description: true,
        peopleCapacity: true,
      },
    });
  }

  async createDescription(
    params: CreateDeskDescriptionParams,
  ): Promise<DeskDescriptionCatalogItem> {
    return this.prisma.deskDescription.create({
      data: params,
      select: {
        id: true,
        name: true,
        description: true,
        peopleCapacity: true,
      },
    });
  }

  async listAmenities(): Promise<AmenityCatalogItem[]> {
    return this.prisma.amenity.findMany({
      orderBy: {
        name: 'asc',
      },
      select: {
        id: true,
        name: true,
      },
    });
  }

  async createAmenity(
    params: CreateAmenityParams,
  ): Promise<AmenityCatalogItem> {
    return this.prisma.amenity.create({
      data: params,
      select: {
        id: true,
        name: true,
      },
    });
  }
}
