import { Reservation } from '../types/reservation.types';

export const mockActiveReservations: Reservation[] = [
  {
    id: '1',
    deskName: 'Escritorio A1',
    zone: 'Zona A',
    locationDescription: 'Ventana',
    dateLabel: 'Mañana',
    startTime: '09:00',
    endTime: '11:00',
    status: 'active',
  },
];

export const mockReservationHistory: Reservation[] = [
  {
    id: '2',
    deskName: 'Escritorio A1',
    zone: 'Zona A',
    locationDescription: 'Ventana',
    dateLabel: '5 de mayo de 2025',
    startTime: '09:00',
    endTime: '11:00',
    status: 'completed',
  },
  {
    id: '3',
    deskName: 'Escritorio A1',
    zone: 'Zona A',
    locationDescription: 'Ventana',
    dateLabel: '4 de mayo de 2025',
    startTime: '09:00',
    endTime: '11:00',
    status: 'completed',
  },
];
