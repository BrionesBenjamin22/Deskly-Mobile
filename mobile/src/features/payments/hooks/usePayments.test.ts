import { renderHook, waitFor } from "@testing-library/react-native";

import { listReservations } from "../../reservations/services/reservations.service";
import { buildReservation } from "../../reservations/testing/reservation.fixtures";
import {
  getPaymentQuote,
  listReservationPayments,
} from "../services/payments.service";
import { usePayments } from "./usePayments";

jest.mock("../../reservations/services/reservations.service", () => ({
  listReservations: jest.fn(),
}));
jest.mock("../services/payments.service", () => ({
  getPaymentQuote: jest.fn(),
  listReservationPayments: jest.fn(),
}));

const mockedListReservations = jest.mocked(listReservations);
const mockedListPayments = jest.mocked(listReservationPayments);
const mockedGetQuote = jest.mocked(getPaymentQuote);

describe("usePayments", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("sincroniza reservas pendientes antes de calcular el saldo visible", async () => {
    const pendingReservation = buildReservation({
      id: "reservation-pending",
      status: "pending_payment",
      date: "2026-08-01",
      dateLabel: "sábado, 1 de agosto",
    });
    mockedListReservations.mockImplementation(
      async (_token, _page, _limit, status) => ({
        reservations: status === "PENDING_PAYMENT" ? [pendingReservation] : [],
        pagination: {
          page: 1,
          limit: 50,
          total: status === "PENDING_PAYMENT" ? 1 : 0,
          totalPages: status === "PENDING_PAYMENT" ? 1 : 0,
        },
      }),
    );
    mockedListPayments.mockResolvedValue([
      {
        paymentId: "payment-1",
        reservationId: pendingReservation.id,
        amountMinorUnits: 600_000,
        currency: "ARS",
        option: "FULL",
        pricingVersion: "V1",
        status: "APPROVED",
        checkoutUrl: null,
        expiresAt: "2026-08-01T15:00:00.000Z",
      },
    ]);
    mockedGetQuote.mockResolvedValue({
      reservationId: pendingReservation.id,
      currency: "ARS",
      pricingVersion: "V1",
      totalMinorUnits: 600_000,
      approvedMinorUnits: 600_000,
      pendingMinorUnits: 0,
      options: [],
    });

    const { result } = renderHook(() => usePayments("member-token"));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockedListReservations).toHaveBeenCalledWith(
      "member-token",
      1,
      50,
      "PENDING_PAYMENT",
    );
    expect(mockedListReservations).toHaveBeenCalledWith(
      "member-token",
      1,
      50,
      "RESERVED",
    );
    expect(mockedListReservations).toHaveBeenCalledWith(
      "member-token",
      1,
      50,
      "ACTIVE",
    );
    expect(mockedListPayments.mock.invocationCallOrder[0]).toBeLessThan(
      mockedGetQuote.mock.invocationCallOrder[0],
    );
    expect(result.current.items).toEqual([
      expect.objectContaining({
        reservationId: "reservation-pending",
        approvedMinorUnits: 600_000,
        pendingMinorUnits: 0,
      }),
    ]);
  });
});
