export type ReservationStatus =
  | 'reserved'
  | 'active'
  | 'completed'
  | 'cancelled';

export type ReservationLocation = {
  areaId: string;
  areaName: string;
  localityId: string;
  localityName: string;
  address?: string;
  latitude?: number;
  longitude?: number;
};

export interface Reservation {
  id: string;
  deskId: string;
  deskCode: string;
  deskName: string;
  memberFullName?: string;
  date: string;
  dateLabel: string;
  startTime: string;
  endTime: string;
  status: ReservationStatus;
  checkedInAt?: string;
  location?: ReservationLocation;
}
