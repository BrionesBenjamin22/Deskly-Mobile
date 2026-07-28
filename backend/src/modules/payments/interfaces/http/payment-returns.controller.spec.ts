import { PaymentReturnsController } from './payment-returns.controller';

describe('PaymentReturnsController', () => {
  const controller = new PaymentReturnsController();

  it.each([
    ['success', 'Pago informado'],
    ['pending', 'Pago en proceso'],
    ['failure', 'Pago no completado'],
  ] as const)('presenta un retorno seguro para %s', (result, title) => {
    const html = controller.show(result);

    expect(html).toContain(title);
    expect(html).toContain('Volver a Deskly');
    expect(html).toContain('window.opener');
    expect(html).not.toContain('payment_id');
    expect(html).not.toContain('approved');
  });
});
