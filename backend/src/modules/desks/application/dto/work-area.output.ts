import {
  LocalityProperties,
  WorkAreaProperties,
} from '../../domain/entities/desk.entity';

export type LocalityOutput = LocalityProperties;

export type WorkAreaOutput = WorkAreaProperties;

export type WorkAreaAvailabilityOutput = {
  areas: (WorkAreaProperties & {
    availableDeskCount: number;
    totalDeskCount: number;
  })[];
};
