export type UpdateDeskInput = {
  id: string;
  code?: string;
  name?: string | null;
  locationDescription?: string | null;
  enabled?: boolean;
};
