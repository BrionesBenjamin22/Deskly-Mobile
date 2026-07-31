import { BadRequestException } from '@nestjs/common';
import {
  THROTTLER_LIMIT,
  THROTTLER_TTL,
} from '@nestjs/throttler/dist/throttler.constants';

import { PaymentSummariesController } from './payment-summaries.controller';
import { PaymentSummaryFilter } from './dto/list-payment-summaries-query.dto';

describe('PaymentSummariesController', () => {
  it('deriva memberId del JWT y no lo acepta desde la consulta', async () => {
    const execute = jest.fn().mockResolvedValue({ items: [] });
    const controller = new PaymentSummariesController({ execute } as never);
    const request = {
      user: { id: 'user-1', member: { id: 'member-1' } },
    } as never;

    await controller.list(
      { page: 2, limit: 9, filter: PaymentSummaryFilter.PENDING },
      request,
    );

    expect(execute).toHaveBeenCalledWith('member-1', 2, 9, 'PENDING');
  });

  it('rechaza usuarios sin miembro antes de consultar pagos', async () => {
    const execute = jest.fn();
    const controller = new PaymentSummariesController({ execute } as never);

    await expect(
      controller.list({ page: 1, limit: 9, filter: PaymentSummaryFilter.ALL }, {
        user: { id: 'admin-1' },
      } as never),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(execute).not.toHaveBeenCalled();
  });

  it('mantiene rate limiting por usuario para la sincronizacion', () => {
    expect(
      Reflect.getMetadata(
        `${THROTTLER_LIMIT}default`,
        PaymentSummariesController.prototype.list,
      ),
    ).toBe(30);
    expect(
      Reflect.getMetadata(
        `${THROTTLER_TTL}default`,
        PaymentSummariesController.prototype.list,
      ),
    ).toBe(60_000);
  });
});
