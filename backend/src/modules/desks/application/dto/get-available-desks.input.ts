import { DeskZoneValue } from '../../domain/entities/desk.entity';

export type GetAvailableDesksInput = {
  date: string;
  startTime: string;
  endTime: string;
  zone?: DeskZoneValue;
};
