export type AvailableDeskOutput = {
  id: string;
  code: string;
  name?: string;
  locationDescription?: string;
};

export type GetAvailableDesksOutput = {
  desks: AvailableDeskOutput[];
};
