export type LoginFormValues = {
  identifier: string;
  password: string;
};

export type RegisterFormValues = {
  email: string;
  username: string;
  password: string;
  fullName: string;
  dni: string;
  phone: string;
};

export type FormErrors<T> = Partial<Record<keyof T, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_PATTERN = /^[a-zA-Z0-9._-]+$/;
const INTEGER_PATTERN = /^\d+$/;
const MAX_INTEGER = 2147483647;

export function validateLogin(
  values: LoginFormValues,
): FormErrors<LoginFormValues> {
  const errors: FormErrors<LoginFormValues> = {};

  if (!values.identifier.trim()) {
    errors.identifier = 'Ingrese su email o nombre de usuario.';
  }

  if (!values.password) {
    errors.password = 'Ingrese su contraseña.';
  } else if (values.password.length < 8 || values.password.length > 72) {
    errors.password = 'La contraseña debe tener entre 8 y 72 caracteres.';
  }

  return errors;
}

export function validateRegister(
  values: RegisterFormValues,
  requiresMember: boolean,
): FormErrors<RegisterFormValues> {
  const errors: FormErrors<RegisterFormValues> = {};
  const email = values.email.trim();
  const username = values.username.trim();

  if (!EMAIL_PATTERN.test(email) || email.length > 255) {
    errors.email = 'Ingrese un email válido.';
  }

  if (
    username.length < 3 ||
    username.length > 60 ||
    !USERNAME_PATTERN.test(username)
  ) {
    errors.username =
      'Use entre 3 y 60 letras, números, puntos, guiones o guion bajo.';
  }

  if (values.password.length < 8 || values.password.length > 72) {
    errors.password = 'La contraseña debe tener entre 8 y 72 caracteres.';
  }

  if (requiresMember) {
    const fullName = values.fullName.trim();

    if (!fullName || fullName.length > 200) {
      errors.fullName =
        'Ingrese nombre y apellido, con un máximo de 200 caracteres.';
    }

    if (!isValidInteger(values.dni)) {
      errors.dni = 'Ingrese un DNI válido, solo con números.';
    }

    if (!isValidInteger(values.phone)) {
      errors.phone = 'Ingrese un teléfono válido, solo con números.';
    }
  }

  return errors;
}

function isValidInteger(value: string) {
  if (!INTEGER_PATTERN.test(value)) {
    return false;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 && parsed <= MAX_INTEGER;
}
