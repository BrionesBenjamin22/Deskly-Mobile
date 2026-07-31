import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { Linking } from 'react-native';

import { AuthTestProvider } from '../../auth/testing/AuthTestProvider';
import {
  createPaymentCheckout,
  getPaymentAttempt,
  getPaymentQuote,
} from '../../payments/services/payments.service';
import {
  createReservation,
  listReservations,
} from '../../reservations/services/reservations.service';
import {
  getAvailableDesks,
  listLocalities,
  listWorkAreas,
} from '../services/desks.service';
import {
  buildDesk,
  buildLocality,
  buildWorkArea,
} from '../testing/desk.fixtures';
import { DesksScreen } from './DesksScreen';

jest.mock('../services/desks.service', () => ({
  DeskServiceError: class DeskServiceError extends Error {},
  getAvailableDesks: jest.fn(),
  listLocalities: jest.fn(),
  listWorkAreas: jest.fn(),
}));
jest.mock('../../reservations/services/reservations.service', () => ({
  ReservationServiceError: class ReservationServiceError extends Error {},
  createReservation: jest.fn(),
  listReservations: jest.fn(),
}));
jest.mock('../../payments/services/payments.service', () => ({
  PaymentServiceError: class PaymentServiceError extends Error {},
  createPaymentCheckout: jest.fn(),
  createPaymentOperationKey: jest.fn(() => 'operation-key'),
  getPaymentAttempt: jest.fn(),
  getPaymentQuote: jest.fn(),
}));

const mockedGetAvailableDesks = jest.mocked(getAvailableDesks);
const mockedListLocalities = jest.mocked(listLocalities);
const mockedListWorkAreas = jest.mocked(listWorkAreas);
const mockedCreateReservation = jest.mocked(createReservation);
const mockedListReservations = jest.mocked(listReservations);
const mockedCreatePaymentCheckout = jest.mocked(createPaymentCheckout);
const mockedGetPaymentAttempt = jest.mocked(getPaymentAttempt);
const mockedGetPaymentQuote = jest.mocked(getPaymentQuote);

describe('DesksScreen con area seleccionada', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedListLocalities.mockResolvedValue([buildLocality()]);
    mockedListWorkAreas.mockResolvedValue([buildWorkArea()]);
    mockedListReservations.mockResolvedValue({
      reservations: [],
      pagination: { page: 1, limit: 50, total: 0, totalPages: 1 },
    });
  });

  it('solicita disponibilidad para el area seleccionada', async () => {
    const selectedArea = buildWorkArea();
    mockedGetAvailableDesks.mockResolvedValue([
      buildDesk({ area: selectedArea, areaId: selectedArea.id }),
    ]);

    render(
      <AuthTestProvider>
        <DesksScreen selectedWorkArea={selectedArea} />
      </AuthTestProvider>,
    );

    expect(await screen.findByText('Escritorio Norte 1')).toBeOnTheScreen();
    await waitFor(() => {
      expect(mockedGetAvailableDesks).toHaveBeenCalledWith(
        expect.objectContaining({
          areaId: selectedArea.id,
          localityId: selectedArea.localityId,
        }),
      );
    });
  }, 10_000);

  it('no muestra escritorios pertenecientes a otra area', async () => {
    const selectedArea = buildWorkArea();
    const otherArea = buildWorkArea({
      id: 'area-2',
      name: 'Sala Sur',
    });
    mockedGetAvailableDesks.mockResolvedValue([
      buildDesk({ area: selectedArea, areaId: selectedArea.id }),
      buildDesk({
        id: 'desk-2',
        code: 'ESC-002',
        name: 'Escritorio de otra area',
        area: otherArea,
        areaId: otherArea.id,
      }),
    ]);

    render(
      <AuthTestProvider>
        <DesksScreen selectedWorkArea={selectedArea} />
      </AuthTestProvider>,
    );

    expect(await screen.findByText('Escritorio Norte 1')).toBeOnTheScreen();
    expect(screen.queryByText('Escritorio de otra area')).not.toBeOnTheScreen();
  });

  it('permite dejar la confirmacion del pago en segundo plano', async () => {
    const selectedArea = buildWorkArea();
    const onReservationCreated = jest.fn();
    let approvePayment!: (value: { status: 'APPROVED' }) => void;
    mockedGetAvailableDesks.mockResolvedValue([
      buildDesk({ area: selectedArea, areaId: selectedArea.id }),
    ]);
    mockedCreateReservation.mockResolvedValue({
      id: 'reservation-1',
    } as never);
    mockedGetPaymentQuote.mockResolvedValue({
      reservationId: 'reservation-1',
      currency: 'ARS',
      pricingVersion: 'v1',
      totalMinorUnits: 10000,
      approvedMinorUnits: 0,
      pendingMinorUnits: 10000,
      options: [{ option: 'FULL', amountMinorUnits: 10000 }],
    });
    mockedCreatePaymentCheckout.mockResolvedValue({
      paymentId: 'payment-1',
      reservationId: 'reservation-1',
      amountMinorUnits: 10000,
      currency: 'ARS',
      option: 'FULL',
      pricingVersion: 'v1',
      status: 'PENDING',
      checkoutUrl: 'https://fake-payments.test/checkout/payment-1',
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    });
    mockedGetPaymentAttempt.mockImplementation(
      () =>
        new Promise((resolve) => {
          approvePayment = resolve as typeof approvePayment;
        }) as never,
    );
    jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);

    render(
      <AuthTestProvider>
        <DesksScreen
          selectedWorkArea={selectedArea}
          onReservationCreated={onReservationCreated}
        />
      </AuthTestProvider>,
    );

    await screen.findByText('Escritorio Norte 1');
    fireEvent.press(screen.getByText('Reservar'));
    fireEvent.press(screen.getByText('Reservar y continuar al pago'));

    expect(await screen.findByText('Esperando confirmacion')).toBeOnTheScreen();
    fireEvent.press(screen.getByText('Dejar de esperar'));
    expect(screen.queryByText('Esperando confirmacion')).toBeNull();

    await act(async () => {
      approvePayment({ status: 'APPROVED' });
    });

    expect(await screen.findByText('Reserva confirmada')).toBeOnTheScreen();
    expect(onReservationCreated).toHaveBeenCalledTimes(1);
  });
});
