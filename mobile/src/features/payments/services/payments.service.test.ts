import {
  createPaymentCheckout,
  getPaymentQuote,
  PaymentServiceError,
} from './payments.service';

describe('payments service seguro', () => {
  afterEach(() => jest.restoreAllMocks());

  it('obtiene cotizacion autenticada desde backend', async () => {
    const quote = {
      reservationId: 'reservation-1',
      currency: 'ARS',
      pricingVersion: 'v1',
      options: [],
    };
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => quote,
    } as Response);

    await expect(getPaymentQuote('access-token', 'reservation-1')).resolves.toEqual(
      quote,
    );
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/reservations/reservation-1/payment-quote'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer access-token',
        }),
      }),
    );
  });

  it('crea checkout sin enviar monto, moneda, miembro ni estado', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        paymentId: 'payment-1',
        reservationId: 'reservation-1',
        option: 'FULL',
        amountMinorUnits: 600_000,
        currency: 'ARS',
        status: 'PENDING',
        checkoutUrl: 'https://fake-payments.test/checkout/payment-1',
        expiresAt: '2026-07-21T12:15:00.000Z',
      }),
    } as Response);

    await createPaymentCheckout('access-token', {
      reservationId: 'reservation-1',
      option: 'FULL',
      idempotencyKey: 'checkout-operation-1',
    });

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(JSON.parse(init.body as string)).toEqual({
      reservationId: 'reservation-1',
      option: 'FULL',
    });
    expect(init.headers).toEqual(
      expect.objectContaining({ 'Idempotency-Key': 'checkout-operation-1' }),
    );
  });

  it('preserva prototipo y mensaje seguro del error', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Revise la reserva e intente nuevamente.' }),
    } as Response);

    const promise = getPaymentQuote('access-token', 'reservation-1');
    await expect(promise).rejects.toBeInstanceOf(PaymentServiceError);
    await expect(promise).rejects.toMatchObject({
      name: 'PaymentServiceError',
      message: 'Revise la reserva e intente nuevamente.',
    });
  });
});
