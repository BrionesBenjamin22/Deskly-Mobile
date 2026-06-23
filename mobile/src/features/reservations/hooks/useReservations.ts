import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  cancelReservation,
  listReservations,
  ReservationServiceError,
} from '../services/reservations.service';
import { Reservation } from '../types/reservation.types';

type ReservationActionStatus = 'idle' | 'loading' | 'success' | 'error';

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
      const response = await listReservations(
        accessToken,
        1,
        50,
        managerView ? 'ACTIVE' : undefined,
        managerView ? today : undefined,
      );
      setReservations(response.reservations);
    } catch (error) {
      setReservations([]);
      setErrorMessage(getFriendlyErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, managerView]);

  useEffect(() => {
    void loadReservations();
  }, [loadReservations, refreshKey]);

  const activeReservations = useMemo(
    () => reservations.filter((reservation) => reservation.status === 'active'),
    [reservations],
  );

  const reservationHistory = useMemo(
    () => reservations.filter((reservation) => reservation.status !== 'active'),
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
