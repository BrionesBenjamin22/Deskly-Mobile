import 'reflect-metadata';

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { ListPaymentSummariesQueryDto } from './list-payment-summaries-query.dto';

describe('ListPaymentSummariesQueryDto', () => {
  it('acepta hasta 9 items y rechaza limites superiores', async () => {
    await expect(
      validate(
        plainToInstance(ListPaymentSummariesQueryDto, {
          page: '1',
          limit: '9',
        }),
      ),
    ).resolves.toHaveLength(0);

    const errors = await validate(
      plainToInstance(ListPaymentSummariesQueryDto, {
        page: '1',
        limit: '10',
      }),
    );
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('limit');
  });
});
