import { renderHook, waitFor } from "@testing-library/react-native";

import { listPaymentSummaries } from "../services/payments.service";
import { usePayments } from "./usePayments";

jest.mock("../services/payments.service", () => ({
  listPaymentSummaries: jest.fn(),
}));

const mockedListPaymentSummaries = jest.mocked(listPaymentSummaries);

describe("usePayments", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("carga una pagina autoritativa con una sola solicitud", async () => {
    mockedListPaymentSummaries.mockResolvedValue({
      items: [
        {
          reservationId: "reservation-paid",
          deskName: "Escritorio A-01",
          date: "2026-08-01T00:00:00.000Z",
          currency: "ARS",
          pricingVersion: "V1",
          totalMinorUnits: 600_000,
          approvedMinorUnits: 600_000,
          pendingMinorUnits: 0,
          attempts: [],
        },
      ],
      pagination: {
        page: 2,
        limit: 9,
        total: 10,
        totalPages: 2,
      },
    });

    const { result } = renderHook(() => usePayments("member-token", 2));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockedListPaymentSummaries).toHaveBeenCalledTimes(1);
    expect(mockedListPaymentSummaries).toHaveBeenCalledWith(
      "member-token",
      2,
      9,
      "ALL",
    );
    expect(result.current.totalPages).toBe(2);
    expect(result.current.items).toEqual([
      expect.objectContaining({
        reservationId: "reservation-paid",
        dateLabel: "1 de agosto de 2026",
        approvedMinorUnits: 600_000,
        pendingMinorUnits: 0,
      }),
    ]);
  });

  it("preserva el error visible cuando falla el resumen", async () => {
    mockedListPaymentSummaries.mockRejectedValue(new Error("network"));

    const { result } = renderHook(() => usePayments("member-token"));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.items).toEqual([]);
    expect(result.current.errorMessage).toBe(
      "Lo sentimos, no pudimos recuperar sus pagos. Intente nuevamente.",
    );
  });
});
