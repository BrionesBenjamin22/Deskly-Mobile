import { ROLES_KEY } from '../../../auth/interfaces/http/decorators/roles.decorator';
import { PaymentOperationsController } from './payment-operations.controller';

describe('PaymentOperationsController', () => {
  it('restringe la operacion a ADMIN y GESTOR', () => {
    expect(Reflect.getMetadata(ROLES_KEY, PaymentOperationsController)).toEqual(
      ['ADMIN', 'GESTOR'],
    );
  });

  it('propaga exclusivamente los limites operativos validados', async () => {
    const execute = jest.fn().mockResolvedValue({ scanned: 0 });
    const controller = new PaymentOperationsController({ execute } as never);

    await expect(
      controller.reconcile({ limit: 20, minAgeMinutes: 15 }),
    ).resolves.toEqual({ scanned: 0 });
    expect(execute).toHaveBeenCalledWith({ limit: 20, minAgeMinutes: 15 });
  });
});
