import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { RegisterBodyDto } from './register-body.dto';

describe('RegisterBodyDto', () => {
  it('accepts an eleven-digit numeric phone', async () => {
    const dto = plainToInstance(RegisterBodyDto, {
      email: 'member@deskly.test',
      username: 'member',
      password: 'Password123',
      member: {
        fullName: 'Deskly Member',
        dni: '12345678',
        phone: '11234567890',
      },
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto.member?.dni).toBe(12345678);
    expect(dto.member?.phone).toBe(11234567890);
  });

  it('rejects a phone containing non-numeric characters', async () => {
    const dto = plainToInstance(RegisterBodyDto, {
      email: 'member@deskly.test',
      username: 'member',
      password: 'Password123',
      member: {
        fullName: 'Deskly Member',
        dni: '12345678',
        phone: '11-2345-6789',
      },
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0]?.children?.[0]?.constraints).toHaveProperty(
      'isInt',
      'El teléfono debe contener solo números.',
    );
  });
});
