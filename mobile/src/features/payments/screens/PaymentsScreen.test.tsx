import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { Linking } from "react-native";

import { AuthTestProvider } from "../../auth/testing/AuthTestProvider";
import { usePayments } from "../hooks/usePayments";
import {
  createPaymentCheckout,
  getPaymentAttempt,
  getPaymentQuote,
} from "../services/payments.service";
import { PaymentsScreen } from "./PaymentsScreen";

jest.mock("../hooks/usePayments");
jest.mock("../services/payments.service", () => ({
  ...jest.requireActual("../services/payments.service"),
  createPaymentCheckout: jest.fn(),
  getPaymentAttempt: jest.fn(),
  getPaymentQuote: jest.fn(),
}));

const mockedUsePayments = usePayments as jest.MockedFunction<
  typeof usePayments
>;
const mockedQuote = getPaymentQuote as jest.MockedFunction<
  typeof getPaymentQuote
>;
const mockedCheckout = createPaymentCheckout as jest.MockedFunction<
  typeof createPaymentCheckout
>;
const mockedAttempt = getPaymentAttempt as jest.MockedFunction<
  typeof getPaymentAttempt
>;
const reloadMock = jest.fn<Promise<void>, []>();

describe("PaymentsScreen checkout seguro", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUsePayments.mockReturnValue({
      items: [
        {
          reservationId: "reservation-1",
          deskName: "Escritorio A-01",
          dateLabel: "21 de julio de 2026",
          totalMinorUnits: 600_000,
          approvedMinorUnits: 180_000,
          pendingMinorUnits: 420_000,
          attempts: [],
        },
      ],
      totalPages: 1,
      isLoading: false,
      errorMessage: null,
      reload: reloadMock,
    });
    mockedQuote.mockResolvedValue({
      reservationId: "reservation-1",
      currency: "ARS",
      pricingVersion: "v1",
      totalMinorUnits: 600_000,
      approvedMinorUnits: 180_000,
      pendingMinorUnits: 420_000,
      options: [{ option: "FULL", amountMinorUnits: 420_000 }],
    });
    mockedCheckout.mockResolvedValue({
      paymentId: "payment-1",
      reservationId: "reservation-1",
      amountMinorUnits: 600_000,
      currency: "ARS",
      option: "FULL",
      pricingVersion: "v1",
      status: "PENDING",
      checkoutUrl: "https://fake-payments.test/checkout/payment-1",
      expiresAt: "2026-07-21T12:15:00.000Z",
    });
    mockedAttempt.mockResolvedValue({
      paymentId: "payment-1",
      reservationId: "reservation-1",
      amountMinorUnits: 600_000,
      currency: "ARS",
      option: "FULL",
      pricingVersion: "v1",
      status: "APPROVED",
      checkoutUrl: null,
      expiresAt: "2026-07-21T12:15:00.000Z",
    });
    jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  it("recarga los pagos con pull-to-refresh", async () => {
    reloadMock.mockResolvedValue();
    render(
      <AuthTestProvider>
        <PaymentsScreen />
      </AuthTestProvider>,
    );

    await act(async () => {
      await screen
        .getByTestId("payments-scroll")
        .props.refreshControl.props.onRefresh();
    });

    expect(reloadMock).toHaveBeenCalledTimes(1);
  });

  it("bloquea el doble toque y confirma solo tras consultar APPROVED", async () => {
    render(
      <AuthTestProvider>
        <PaymentsScreen />
      </AuthTestProvider>,
    );

    fireEvent.press(screen.getByText(/Completar pago/));
    expect(
      await screen.findByLabelText("Cerrar opciones de pago"),
    ).toBeOnTheScreen();
    const option = await screen.findByText(/Pagar total/);
    fireEvent.press(option);
    fireEvent.press(option);

    await waitFor(() => expect(mockedCheckout).toHaveBeenCalledTimes(1));
    expect(Linking.openURL).toHaveBeenCalledWith(
      "https://fake-payments.test/checkout/payment-1",
    );
    await screen.findByText("Pago confirmado");
    expect(mockedAttempt).toHaveBeenCalledWith("access-token", "payment-1");
  });

  it("presenta la cotizacion en un modal y permite cerrarla", async () => {
    render(
      <AuthTestProvider>
        <PaymentsScreen />
      </AuthTestProvider>,
    );

    fireEvent.press(screen.getByText(/Completar pago/));

    expect(await screen.findByText("Completar pago")).toBeOnTheScreen();
    expect(screen.getByText(/Pagar total/)).toBeOnTheScreen();
    fireEvent.press(screen.getByText("Cancelar"));
    expect(screen.queryByText(/Pagar total/)).toBeNull();
    expect(mockedCheckout).not.toHaveBeenCalled();
  });

  it("filtra pagos pendientes o completados desde la pantalla", () => {
    render(
      <AuthTestProvider>
        <PaymentsScreen />
      </AuthTestProvider>,
    );

    fireEvent.press(screen.getByText("Completados"));

    expect(mockedUsePayments).toHaveBeenLastCalledWith(
      "access-token",
      1,
      0,
      "COMPLETED",
    );
    expect(screen.getByRole("radio", { name: "Completados" })).toHaveProp(
      "accessibilityState",
      { selected: true },
    );
  });

  it("no confirma por abrir y volver del checkout mientras backend sigue pendiente", async () => {
    jest.useFakeTimers();
    mockedAttempt.mockResolvedValue({
      paymentId: "payment-1",
      reservationId: "reservation-1",
      amountMinorUnits: 600_000,
      currency: "ARS",
      option: "FULL",
      pricingVersion: "v1",
      status: "PENDING",
      checkoutUrl: null,
      expiresAt: "2026-07-21T12:15:00.000Z",
    });
    render(
      <AuthTestProvider>
        <PaymentsScreen />
      </AuthTestProvider>,
    );
    fireEvent.press(screen.getByText(/Completar pago/));
    fireEvent.press(await screen.findByText(/Pagar total/));

    await act(async () => {
      await jest.runAllTimersAsync();
    });

    expect(screen.queryByText("Pago confirmado")).toBeNull();
    expect(await screen.findByText("Pago aun pendiente")).toBeOnTheScreen();
    jest.useRealTimers();
  });

  it("deja de bloquear la pantalla y notifica si el pago se aprueba despues", async () => {
    let approvePayment!: (
      value: Awaited<ReturnType<typeof getPaymentAttempt>>,
    ) => void;
    mockedAttempt.mockReturnValue(
      new Promise((resolve) => {
        approvePayment = resolve;
      }),
    );
    render(
      <AuthTestProvider>
        <PaymentsScreen />
      </AuthTestProvider>,
    );
    fireEvent.press(screen.getByText(/Completar pago/));
    fireEvent.press(await screen.findByText(/Pagar total/));

    expect(await screen.findByText("Esperando confirmacion")).toBeOnTheScreen();
    fireEvent.press(screen.getByText("Dejar de esperar"));
    expect(screen.queryByText("Esperando confirmacion")).toBeNull();

    await act(async () => {
      approvePayment({
        paymentId: "payment-1",
        reservationId: "reservation-1",
        amountMinorUnits: 600_000,
        currency: "ARS",
        option: "FULL",
        pricingVersion: "v1",
        status: "APPROVED",
        checkoutUrl: null,
        expiresAt: "2026-07-21T12:15:00.000Z",
      });
    });

    expect(await screen.findByText("Pago confirmado")).toBeOnTheScreen();
  });
});
