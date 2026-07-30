import { useCallback, useEffect, useState } from "react";

import { listPaymentSummaries } from "../services/payments.service";
import type { PaymentReservationItem } from "../types/payment.types";

const PAGE_SIZE = 9;

function toDateLabel(dateValue: string) {
  const calendarDate = dateValue.split("T")[0];
  const date = new Date(`${calendarDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateValue;

  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
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
      const response = await listPaymentSummaries(
        accessToken,
        page,
        PAGE_SIZE,
      );
      setItems(
        response.items.map(({ date, currency: _currency, pricingVersion: _pricingVersion, ...item }) => ({
          ...item,
          dateLabel: toDateLabel(date),
        })),
      );
      setTotalPages(Math.max(1, response.pagination.totalPages));
    } catch {
      setItems([]);
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
