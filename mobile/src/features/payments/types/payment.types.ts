export interface Payment {
  id: string;
  reservationId: string;
  date: string;
  amount: number;
  createdAt: string;
  updatedAt: string;
}

export interface EnrichedPayment extends Payment {
  deskCode: string;
  deskName: string;
  reservationDate: string;
  reservationDateLabel: string;
  startTime: string;
  endTime: string;
}

export interface ReservationPaymentSummary {
  reservationId: string;
  deskCode: string;
  deskName: string;
  reservationDateLabel: string;
  startTime: string;
  endTime: string;
  totalAbonado: number;
  lastPaymentDate: string;
  lastPaymentId: string;
}
