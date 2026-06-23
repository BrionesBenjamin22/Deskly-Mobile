export type ReservationStatus =
  | 'reserved'
  | 'active'
  | 'completed'
  | 'cancelled';

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
}
