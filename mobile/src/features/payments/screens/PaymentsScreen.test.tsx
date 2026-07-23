import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Linking } from 'react-native';

import { usePayments } from '../hooks/usePayments';
import {
  createPaymentCheckout,
  getPaymentAttempt,
  getPaymentQuote,
} from '../services/payments.service';
import { PaymentsScreen } from './PaymentsScreen';

jest.mock('../hooks/usePayments');
jest.mock('../services/payments.service', () => ({
  ...jest.requireActual('../services/payments.service'),
  createPaymentCheckout: jest.fn(),
  getPaymentAttempt: jest.fn(),
  getPaymentQuote: jest.fn(),
}));

const mockedUsePayments = usePayments as jest.MockedFunction<typeof usePayments>;
const mockedQuote = getPaymentQuote as jest.MockedFunction<typeof getPaymentQuote>;
const mockedCheckout = createPaymentCheckout as jest.MockedFunction<
  typeof createPaymentCheckout
>;
const mockedAttempt = getPaymentAttempt as jest.MockedFunction<
  typeof getPaymentAttempt
>;

describe('PaymentsScreen checkout seguro', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUsePayments.mockReturnValue({
      items: [
        {
          reservationId: 'reservation-1',
          deskName: 'Escritorio A-01',
          dateLabel: '21 de julio de 2026',
          attempts: [],
        },
      ],
      totalPages: 1,
      isLoading: false,
      errorMessage: null,
      reload: jest.fn(),
    });
    mockedQuote.mockResolvedValue({
      reservationId: 'reservation-1',
      currency: 'ARS',
      pricingVersion: 'v1',
      options: [{ option: 'FULL', amountMinorUnits: 600_000 }],
    });
    mockedCheckout.mockResolvedValue({
      paymentId: 'payment-1',
      reservationId: 'reservation-1',
      amountMinorUnits: 600_000,
      currency: 'ARS',
      option: 'FULL',
      pricingVersion: 'v1',
      status: 'PENDING',
      checkoutUrl: 'https://fake-payments.test/checkout/payment-1',
      expiresAt: '2026-07-21T12:15:00.000Z',
    });
    mockedAttempt.mockResolvedValue({
      paymentId: 'payment-1',
      reservationId: 'reservation-1',
      amountMinorUnits: 600_000,
      currency: 'ARS',
      option: 'FULL',
      pricingVersion: 'v1',
      status: 'APPROVED',
      checkoutUrl: null,
      expiresAt: '2026-07-21T12:15:00.000Z',
    });
    jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  it('bloquea el doble toque y confirma solo tras consultar APPROVED', async () => {
    render(<PaymentsScreen accessToken="access-token" />);

    fireEvent.press(screen.getByText('Cotizar pago'));
    const option = await screen.findByText(/Pagar total/);
    fireEvent.press(option);
    fireEvent.press(option);

    await waitFor(() => expect(mockedCheckout).toHaveBeenCalledTimes(1));
    expect(Linking.openURL).toHaveBeenCalledWith(
      'https://fake-payments.test/checkout/payment-1',
    );
    await screen.findByText('Pago confirmado');
    expect(mockedAttempt).toHaveBeenCalledWith('access-token', 'payment-1');
  });

  it('no confirma por abrir y volver del checkout mientras backend sigue pendiente', async () => {
    jest.useFakeTimers();
    mockedAttempt.mockResolvedValue({
      paymentId: 'payment-1',
      reservationId: 'reservation-1',
      amountMinorUnits: 600_000,
      currency: 'ARS',
      option: 'FULL',
      pricingVersion: 'v1',
      status: 'PENDING',
      checkoutUrl: null,
      expiresAt: '2026-07-21T12:15:00.000Z',
    });
    render(<PaymentsScreen accessToken="access-token" />);
    fireEvent.press(screen.getByText('Cotizar pago'));
    fireEvent.press(await screen.findByText(/Pagar total/));

    await act(async () => {
      await jest.runAllTimersAsync();
    });

    expect(screen.queryByText('Pago confirmado')).toBeNull();
    expect(await screen.findByText('Pago aun pendiente')).toBeOnTheScreen();
    jest.useRealTimers();
  });
});
