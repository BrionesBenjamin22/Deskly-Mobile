import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../../../infrastructure/database/prisma.service';

export type WorkAreaPayload = {
  name: string;
  description?: string;
  localityId: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  active?: boolean;
};

const selection = {
  id: true,
  name: true,
  description: true,
  localityId: true,
  address: true,
  latitude: true,
  longitude: true,
  active: true,
  locality: { select: { id: true, name: true, active: true } },
} as const;

@Injectable()
export class WorkAreasService {
  constructor(private readonly prisma: PrismaService) {}

  list(localityId?: string, activeOnly = true) {
    return this.prisma.workArea.findMany({
      where: {
        ...(localityId ? { localityId } : {}),
        ...(activeOnly ? { active: true, locality: { active: true } } : {}),
      },
      orderBy: [{ locality: { name: 'asc' } }, { name: 'asc' }],
      select: selection,
    });
  }

  find(id: string) {
    return this.require(id);
  }

  async create(payload: WorkAreaPayload) {
    await this.requireActiveLocality(payload.localityId);
    await this.ensureUniqueName(payload.localityId, payload.name);
    return this.prisma.workArea.create({
      data: {
        name: payload.name.trim(),
        localityId: payload.localityId,
        description: payload.description?.trim() || null,
        address: payload.address?.trim() || null,
        latitude: payload.latitude,
        longitude: payload.longitude,
        active: payload.active ?? true,
      },
      select: selection,
    });
  }

  async update(id: string, payload: Partial<WorkAreaPayload>) {
    const current = await this.require(id);
    const localityId = payload.localityId ?? current.localityId;
    if (payload.localityId) await this.requireActiveLocality(localityId);
    if (payload.name || payload.localityId) {
      await this.ensureUniqueName(localityId, payload.name ?? current.name, id);
    }
    return this.prisma.workArea.update({
      where: { id },
      data: {
        ...(payload.name ? { name: payload.name.trim() } : {}),
        ...(payload.localityId ? { localityId: payload.localityId } : {}),
        ...(payload.description !== undefined
          ? { description: payload.description.trim() || null }
          : {}),
        ...(payload.address !== undefined
          ? { address: payload.address.trim() || null }
          : {}),
        ...(payload.latitude !== undefined
          ? { latitude: payload.latitude }
          : {}),
        ...(payload.longitude !== undefined
          ? { longitude: payload.longitude }
          : {}),
        ...(typeof payload.active === 'boolean'
          ? { active: payload.active }
          : {}),
      },
      select: selection,
    });
  }

  async remove(id: string) {
    await this.require(id);
    const desks = await this.prisma.desk.count({
      where: { areaId: id, deletedAt: null },
    });
    if (desks > 0) {
      throw new ConflictException({
        message: 'El area de trabajo tiene escritorios activos.',
        error:
          'Lo sentimos, reasigne o elimine sus escritorios e intente nuevamente.',
      });
    }
    await this.prisma.workArea.update({
      where: { id },
      data: { active: false },
    });
  }

  private async require(id: string) {
    const area = await this.prisma.workArea.findUnique({ where: { id } });
    if (!area) {
      throw new NotFoundException({
        message: 'Area de trabajo no encontrada.',
        error:
          'Lo sentimos, no pudimos recuperar el area de trabajo. Intente nuevamente.',
      });
    }
    return area;
  }

  private async requireActiveLocality(id: string) {
    const locality = await this.prisma.locality.findFirst({
      where: { id, active: true },
    });
    if (!locality) {
      throw new NotFoundException({
        message: 'Localidad no encontrada o inactiva.',
        error: 'Seleccione otra localidad e intente nuevamente.',
      });
    }
  }

  private async ensureUniqueName(
    localityId: string,
    name: string,
    excludeId?: string,
  ) {
    const existing = await this.prisma.workArea.findFirst({
      where: {
        localityId,
        name: { equals: name.trim(), mode: 'insensitive' },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    if (existing) {
      throw new ConflictException({
        message: 'Ya existe un area con ese nombre en la localidad.',
        error: 'Ingrese otro nombre e intente nuevamente.',
      });
    }
  }
}
