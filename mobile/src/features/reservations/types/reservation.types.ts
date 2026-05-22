export type ReservationStatus = 'active' | 'completed' | 'cancelled';

export interface Reservation {
  id: string;
  deskName: string;
  zone: string;
  locationDescription: string;
  dateLabel: string;
  startTime: string;
  endTime: string;
  status: ReservationStatus;
}
