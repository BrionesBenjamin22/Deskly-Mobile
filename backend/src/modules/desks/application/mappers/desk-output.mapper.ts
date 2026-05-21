import { Desk } from '../../domain/entities/desk.entity';
import { DeskOutput } from '../dto/desk.output';

export function toDeskOutput(desk: Desk): DeskOutput {
  return {
    id: desk.id,
    code: desk.code,
    ...(desk.name ? { name: desk.name } : {}),
    ...(desk.locationDescription
      ? { locationDescription: desk.locationDescription }
      : {}),
    enabled: desk.enabled,
    ...(desk.createdAt ? { createdAt: desk.createdAt.toISOString() } : {}),
    ...(desk.updatedAt ? { updatedAt: desk.updatedAt.toISOString() } : {}),
  };
}
