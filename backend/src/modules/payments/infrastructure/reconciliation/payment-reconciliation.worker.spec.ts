import { PaymentReconciliationWorker } from './payment-reconciliation.worker';
import { readPaymentReconciliationConfig } from './payment-reconciliation.config';

describe('Payment reconciliation automation', () => {
  it('permanece deshabilitada de forma segura por defecto', () => {
    expect(readPaymentReconciliationConfig({})).toEqual({
      enabled: false,
      intervalMs: 60_000,
      limit: 50,
      minAgeMinutes: 5,
    });
  });

  it('rechaza intervalos y lotes fuera de limites', () => {
    expect(() =>
      readPaymentReconciliationConfig({
        PAYMENT_RECONCILIATION_ENABLED: 'true',
        PAYMENT_RECONCILIATION_INTERVAL_MS: '100',
      }),
    ).toThrow('PAYMENT_RECONCILIATION_INTERVAL_MS');
    expect(() =>
      readPaymentReconciliationConfig({
        PAYMENT_RECONCILIATION_ENABLED: 'true',
        PAYMENT_RECONCILIATION_LIMIT: '101',
      }),
    ).toThrow('PAYMENT_RECONCILIATION_LIMIT');
  });

  it('no ejecuta el caso de uso cuando esta deshabilitada', async () => {
    const reconciliation = { execute: jest.fn() };
    const worker = new PaymentReconciliationWorker(
      reconciliation as never,
      readPaymentReconciliationConfig({}),
    );

    worker.onModuleInit();
    await Promise.resolve();
    worker.onModuleDestroy();

    expect(reconciliation.execute).not.toHaveBeenCalled();
  });

  it('ejecuta inmediatamente con configuracion acotada', async () => {
    const reconciliation = {
      execute: jest.fn().mockResolvedValue({
        scanned: 0,
        updated: 0,
        expired: 0,
        retryableFailures: 0,
        inconsistencies: 0,
      }),
    };
    const worker = new PaymentReconciliationWorker(reconciliation as never, {
      enabled: true,
      intervalMs: 60_000,
      limit: 25,
      minAgeMinutes: 10,
    });

    worker.onModuleInit();
    await Promise.resolve();
    worker.onModuleDestroy();

    expect(reconciliation.execute).toHaveBeenCalledWith({
      limit: 25,
      minAgeMinutes: 10,
    });
  });

  it('omite una ejecucion mientras existe otra en vuelo', async () => {
    let resolveExecution: (() => void) | undefined;
    const reconciliation = {
      execute: jest.fn(
        () =>
          new Promise<void>((resolve) => {
            resolveExecution = resolve;
          }),
      ),
    };
    const worker = new PaymentReconciliationWorker(reconciliation as never, {
      enabled: true,
      intervalMs: 60_000,
      limit: 50,
      minAgeMinutes: 5,
    });

    const first = worker.runOnce();
    await Promise.resolve();
    await expect(worker.runOnce()).resolves.toBeNull();
    resolveExecution?.();
    await first;

    expect(reconciliation.execute).toHaveBeenCalledTimes(1);
  });
});
