import { useCallback, useEffect, useState } from "react";

import { listReservations } from "../../reservations/services/reservations.service";
import {
  getPaymentQuote,
  listReservationPayments,
} from "../services/payments.service";
import type { PaymentReservationItem } from "../types/payment.types";

const PAGE_SIZE = 9;
const FETCH_LIMIT = 50;

async function listPayableReservations(accessToken: string) {
  const statuses = ["PENDING_PAYMENT", "RESERVED", "ACTIVE"] as const;
  const firstPages = await Promise.all(
    statuses.map((status) =>
      listReservations(accessToken, 1, FETCH_LIMIT, status),
    ),
  );
  const remainingPages = await Promise.all(
    firstPages.flatMap((response, statusIndex) =>
      Array.from(
        { length: Math.max(0, response.pagination.totalPages - 1) },
        (_, index) =>
          listReservations(
            accessToken,
            index + 2,
            FETCH_LIMIT,
            statuses[statusIndex],
          ),
      ),
    ),
  );
  const reservations = [
    ...firstPages.flatMap((response) => response.reservations),
    ...remainingPages.flatMap((response) => response.reservations),
  ];
  return [
    ...new Map(
      reservations.map((reservation) => [reservation.id, reservation]),
    ).values(),
  ];
}

export function usePayments(accessToken: string, page = 1, refreshKey = 0) {
  const [items, setItems] = useState<PaymentReservationItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const reservations = await listPayableReservations(accessToken);
      const paymentData = await Promise.all(
        reservations.map(async (reservation) => {
          const attempts = await listReservationPayments(
            accessToken,
            reservation.id,
          );
          const quote = await getPaymentQuote(accessToken, reservation.id);
          return [attempts, quote] as const;
        }),
      );
      const registeredPayments = reservations
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
        );
      const start = Math.max(0, page - 1) * PAGE_SIZE;
      setItems(registeredPayments.slice(start, start + PAGE_SIZE));
      setTotalPages(
        Math.max(1, Math.ceil(registeredPayments.length / PAGE_SIZE)),
      );
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
