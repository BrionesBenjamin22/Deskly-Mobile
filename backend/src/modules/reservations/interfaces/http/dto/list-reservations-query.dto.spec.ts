import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { ListReservationsQueryDto } from './list-reservations-query.dto';

describe('ListReservationsQueryDto', () => {
  it('acepta PENDING_PAYMENT para recuperar pagos aun no sincronizados', async () => {
    const query = plainToInstance(ListReservationsQueryDto, {
      status: 'PENDING_PAYMENT',
    });

    await expect(validate(query)).resolves.toHaveLength(0);
  });

  it('continua rechazando estados desconocidos', async () => {
    const query = plainToInstance(ListReservationsQueryDto, {
      status: 'UNKNOWN',
    });

    const errors = await validate(query);

    expect(errors).toHaveLength(1);
    expect(errors[0].constraints?.isIn).toBe(
      'El estado de la reserva no es valido.',
    );
  });
});
