import { validateLogin, validateRegister } from './auth.validation';

const validValues = {
  email: 'member@deskly.test',
  username: 'member',
  password: 'Password1',
  fullName: '',
  dni: '',
  phone: '',
};

describe('validateRegister password', () => {
  it.each([
    ['Pass1', 'La contraseña debe tener entre 8 y 72 caracteres.'],
    ['password1', 'La contraseña debe tener al menos una mayúscula.'],
    ['Password', 'La contraseña debe tener al menos un número.'],
  ])('mantiene el contrato de seguridad para %s', (password, message) => {
    expect(validateRegister({ ...validValues, password }, false).password).toBe(
      message,
    );
  });

  it('acepta una contraseña que cumple todos los requisitos', () => {
    expect(validateRegister(validValues, false).password).toBeUndefined();
  });
});

describe('validateLogin password', () => {
  it('solo exige que la contraseña este presente', () => {
    expect(validateLogin({ identifier: 'member', password: '' }).password).toBe(
      'Ingrese su contraseña.',
    );
  });

  it('permite credenciales existentes aunque no cumplan la politica actual', () => {
    const errors = validateLogin({ identifier: 'member', password: 'password' });
    expect(errors.password).toBeUndefined();
    expect(Object.keys(errors)).toHaveLength(0);
  });
});
