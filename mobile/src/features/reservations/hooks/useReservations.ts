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

export function useReservations(refreshKey = 0) {
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
      const response = await listReservations(1, 9);
      setReservations(response.reservations);
    } catch (error) {
      setReservations([]);
      setErrorMessage(getFriendlyErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

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
      await cancelReservation(reservation.id);
      await loadReservations();
      setActionStatus('success');
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
