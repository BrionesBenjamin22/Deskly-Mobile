import { useCallback, useEffect, useState } from 'react';

import { listReservations } from '../../reservations/services/reservations.service';
import { listPayments } from '../services/payments.service';
import { ReservationPaymentSummary } from '../types/payment.types';

export function usePayments(refreshKey = 0) {
  const [summaries, setSummaries] = useState<ReservationPaymentSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [paymentsResult, reservationsResult] = await Promise.all([
        listPayments(),
        listReservations(1, 50),
      ]);

      const reservationMap = new Map(
        reservationsResult.reservations.map((r) => [r.id, r]),
      );

      // Agrupar pagos por reservationId y sumar montos
      const grouped = new Map<string, ReservationPaymentSummary>();

      for (const p of paymentsResult.payments) {
        const reservation = reservationMap.get(p.reservationId);
        const existing = grouped.get(p.reservationId);

        if (existing) {
          existing.totalAbonado += p.amount;
          if (new Date(p.createdAt) > new Date(existing.lastPaymentDate)) {
            existing.lastPaymentDate = p.createdAt;
            existing.lastPaymentId = p.id;
          }
        } else {
          grouped.set(p.reservationId, {
            reservationId: p.reservationId,
            deskCode: reservation?.deskCode ?? '—',
            deskName: reservation?.deskName ?? `Escritorio ${reservation?.deskCode ?? '—'}`,
            reservationDateLabel: reservation?.dateLabel ?? '—',
            startTime: reservation?.startTime ?? '—',
            endTime: reservation?.endTime ?? '—',
            totalAbonado: p.amount,
            lastPaymentDate: p.createdAt,
            lastPaymentId: p.id,
          });
        }
      }

      const result = Array.from(grouped.values()).sort(
        (a, b) => new Date(b.lastPaymentDate).getTime() - new Date(a.lastPaymentDate).getTime(),
      );

      setSummaries(result);
    } catch {
      setErrorMessage('No pudimos cargar tus pagos. Revisa tu conexión e intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  return { summaries, isLoading, errorMessage };
}
