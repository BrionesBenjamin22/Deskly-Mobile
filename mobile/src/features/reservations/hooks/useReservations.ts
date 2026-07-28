import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  cancelReservation,
  listReservations,
  ReservationServiceError,
} from '../services/reservations.service';
import { Reservation } from '../types/reservation.types';

type ReservationActionStatus = 'idle' | 'loading' | 'success' | 'error';

const RESERVATION_STATUS_PRIORITY: Record<Reservation['status'], number> = {
  active: 0,
  pending_payment: 1,
  reserved: 2,
  completed: 3,
  cancelled: 4,
};

export function sortReservationsForDisplay(
  reservations: Reservation[],
): Reservation[] {
  return [...reservations].sort((left, right) => {
    const statusDifference =
      RESERVATION_STATUS_PRIORITY[left.status] -
      RESERVATION_STATUS_PRIORITY[right.status];
    if (statusDifference !== 0) return statusDifference;
    const dateDifference = left.date.localeCompare(right.date);
    if (dateDifference !== 0) return dateDifference;
    return left.startTime.localeCompare(right.startTime);
  });
}

function getFriendlyErrorMessage(error: unknown) {
  if (error instanceof ReservationServiceError) {
    return error.message;
  }

  return 'Lo sentimos, no pudimos recuperar sus reservas. Intente nuevamente.';
}

export function useReservations(
  accessToken: string,
  refreshKey = 0,
  onCancelled?: () => void,
  managerView = false,
  selectedDate?: string,
) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionStatus, setActionStatus] =
    useState<ReservationActionStatus>('idle');

  const loadReservations = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const today = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Argentina/Buenos_Aires',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date());
      const date = selectedDate ?? today;
      if (managerView) {
        const [reserved, active] = await Promise.all([
          listReservations(accessToken, 1, 50, 'RESERVED', date),
          listReservations(accessToken, 1, 50, 'ACTIVE', date),
        ]);
        setReservations([...reserved.reservations, ...active.reservations]);
      } else {
        const response = await listReservations(accessToken, 1, 50);
        setReservations(response.reservations);
      }
    } catch (error) {
      setReservations([]);
      setErrorMessage(getFriendlyErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, managerView, selectedDate]);

  useEffect(() => {
    void loadReservations();
  }, [loadReservations, refreshKey]);

  const activeReservations = useMemo(
    () =>
      sortReservationsForDisplay(
        reservations.filter((reservation) =>
          ['active', 'pending_payment', 'reserved'].includes(
            reservation.status,
          ),
        ),
      ),
    [reservations],
  );

  const reservationHistory = useMemo(
    () =>
      sortReservationsForDisplay(
        reservations.filter(
          (reservation) =>
            !['active', 'pending_payment', 'reserved'].includes(
              reservation.status,
            ),
        ),
      ),
    [reservations],
  );

  const handleCancelReservation = async (reservation: Reservation) => {
    setIsCancelling(true);
    setActionStatus('loading');

    try {
      await cancelReservation(reservation.id, accessToken);
      await loadReservations();
      setActionStatus('success');
      onCancelled?.();
    } catch {
      setActionStatus('error');
    } finally {
      setIsCancelling(false);
    }
  };

  return {
    actionStatus,
    activeReservations,
    clearActionStatus: () => setActionStatus('idle'),
    errorMessage,
    handleCancelReservation,
    isCancelling,
    isLoading,
    refresh: loadReservations,
    reservationHistory,
  };
}
