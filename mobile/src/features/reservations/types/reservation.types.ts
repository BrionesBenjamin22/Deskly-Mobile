export type ReservationStatus = 'active' | 'completed' | 'cancelled';

export interface Reservation {
  id: string;
  deskId: string;
  deskCode: string;
  deskName: string;
  date: string;
  dateLabel: string;
  startTime: string;
  endTime: string;
  status: ReservationStatus;
}
