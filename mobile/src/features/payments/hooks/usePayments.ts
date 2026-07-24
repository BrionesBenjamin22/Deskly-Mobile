import { useCallback, useEffect, useState } from "react";

import { listReservations } from "../../reservations/services/reservations.service";
import {
  getPaymentQuote,
  listReservationPayments,
} from "../services/payments.service";
import type { PaymentReservationItem } from "../types/payment.types";

export function usePayments(accessToken: string, page = 1, refreshKey = 0) {
  const [items, setItems] = useState<PaymentReservationItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const reservations = await listReservations(
        accessToken,
        page,
        9,
        "RESERVED",
      );
      const paymentData = await Promise.all(
        reservations.reservations.map((reservation) =>
          Promise.all([
            listReservationPayments(accessToken, reservation.id),
            getPaymentQuote(accessToken, reservation.id),
          ]),
        ),
      );
      setItems(
        reservations.reservations
          .map((reservation, index) => {
            const [attempts, quote] = paymentData[index];
            return {
              reservationId: reservation.id,
              deskName: reservation.deskName,
              dateLabel: reservation.dateLabel,
              totalMinorUnits: quote.totalMinorUnits,
              approvedMinorUnits: quote.approvedMinorUnits,
              pendingMinorUnits: quote.pendingMinorUnits,
              attempts,
            };
          })
          .filter((item) =>
            item.attempts.some((attempt) => attempt.status === "APPROVED"),
          ),
      );
      setTotalPages(Math.max(1, reservations.pagination.totalPages));
    } catch {
      setErrorMessage(
        "Lo sentimos, no pudimos recuperar sus pagos. Intente nuevamente.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, page]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  return { items, totalPages, isLoading, errorMessage, reload: load };
}
