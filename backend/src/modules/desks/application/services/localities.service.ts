import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../../../infrastructure/database/prisma.service';

export type LocalityPayload = {
  name: string;
  active?: boolean;
};

@Injectable()
export class LocalitiesService {
  constructor(private readonly prisma: PrismaService) {}

  list(activeOnly = true) {
    return this.prisma.locality.findMany({
      where: activeOnly ? { active: true } : {},
      orderBy: { name: 'asc' },
      select: { id: true, name: true, active: true },
    });
  }

  find(id: string) {
    return this.require(id);
  }

  async create(payload: LocalityPayload) {
    await this.ensureUniqueName(payload.name);
    return this.prisma.locality.create({
      data: { name: payload.name.trim(), active: payload.active ?? true },
      select: { id: true, name: true, active: true },
    });
  }

  async update(id: string, payload: Partial<LocalityPayload>) {
    await this.require(id);
    if (payload.name) await this.ensureUniqueName(payload.name, id);
    return this.prisma.locality.update({
      where: { id },
      data: {
        ...(payload.name ? { name: payload.name.trim() } : {}),
        ...(typeof payload.active === 'boolean'
          ? { active: payload.active }
          : {}),
      },
      select: { id: true, name: true, active: true },
    });
  }

  async remove(id: string) {
    await this.require(id);
    const areas = await this.prisma.workArea.count({
      where: { localityId: id, active: true },
    });
    if (areas > 0) {
      throw new ConflictException({
        message: 'La localidad tiene areas de trabajo activas.',
        error:
          'Lo sentimos, desactive primero sus areas de trabajo e intente nuevamente.',
      });
    }
    await this.prisma.locality.update({
      where: { id },
      data: { active: false },
    });
  }

  private async require(id: string) {
    const locality = await this.prisma.locality.findUnique({ where: { id } });
    if (!locality) {
      throw new NotFoundException({
        message: 'Localidad no encontrada.',
        error:
          'Lo sentimos, no pudimos recuperar la localidad. Intente nuevamente.',
      });
    }
    return locality;
  }

  private async ensureUniqueName(name: string, excludeId?: string) {
    const existing = await this.prisma.locality.findFirst({
      where: {
        name: { equals: name.trim(), mode: 'insensitive' },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    if (existing) {
      throw new ConflictException({
        message: 'Ya existe una localidad con ese nombre.',
        error: 'Ingrese otro nombre e intente nuevamente.',
      });
    }
  }
}
