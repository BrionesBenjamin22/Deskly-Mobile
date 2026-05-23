import { DeskOutput } from './desk.output';

export type ListDesksOutput = {
  desks: DeskOutput[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
