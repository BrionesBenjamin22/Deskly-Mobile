export type CreateReservationOutput = {
  reservationId: string;
  deskId: string;
  deskCode: string;
  deskName?: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'ACTIVE';
};
