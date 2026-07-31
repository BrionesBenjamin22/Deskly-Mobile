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

const DNI_LENGTH = 8;
const PHONE_LENGTH = 10;

function isValidDNI(dni: string): boolean {
  const cleanDNI = dni.replace(/\D/g, '');

  if (cleanDNI.length !== DNI_LENGTH) {
    return false;
  }

  if (!INTEGER_PATTERN.test(cleanDNI)) {
    return false;
  }

  return true;
}

function isValidPhone(phone: string): boolean {
  const cleanPhone = phone.replace(/\D/g, '');

  if (cleanPhone.length !== PHONE_LENGTH) {
    return false;
  }

  if (!INTEGER_PATTERN.test(cleanPhone)) {
    return false;
  }

  return true;
}

export function validateProfileEmail(value: string): string | undefined {
  if (!value.trim()) return 'El email no puede estar vacío.';
  if (!EMAIL_PATTERN.test(value.trim())) return 'Ingrese un email válido.';
  if (value.trim().length > 255) return 'El email no puede superar los 255 caracteres.';
  return undefined;
}

export function validateProfileUsername(value: string): string | undefined {
  const v = value.trim();
  if (!v) return 'El nombre de usuario no puede estar vacío.';
  if (v.length < 3) return 'El nombre de usuario debe tener al menos 3 caracteres.';
  if (v.length > 60) return 'El nombre de usuario no puede superar los 60 caracteres.';
  if (!USERNAME_PATTERN.test(v)) return 'Solo se permiten letras, números, puntos, guiones o guion bajo.';
  return undefined;
}

export function validateProfileFullName(value: string): string | undefined {
  const v = value.trim();
  if (!v) return 'El nombre y apellido no puede estar vacío.';
  if (v.length > 200) return 'No puede superar los 200 caracteres.';
  return undefined;
}

export function validateProfilePhone(value: string): string | undefined {
  if (!value) return undefined;
  const clean = value.replace(/\D/g, '');
  if (clean.length > PHONE_LENGTH) return `El teléfono no puede tener más de ${PHONE_LENGTH} dígitos.`;
  if (clean.length > 0 && clean.length < PHONE_LENGTH) return `El teléfono debe tener exactamente ${PHONE_LENGTH} dígitos.`;
  if (clean.length === 0) return 'El teléfono no puede estar vacío.';
  return undefined;
}

export function getRealtimeDNIError(dni: string): string | undefined {
  if (!dni) {
    return undefined;
  }

  const cleanDNI = dni.replace(/\D/g, '');

  if (cleanDNI.length > DNI_LENGTH) {
    return `El DNI no puede tener más de ${DNI_LENGTH} dígitos.`;
  }

  return undefined;
}

export function getRealtimePhoneError(phone: string): string | undefined {
  if (!phone) {
    return undefined;
  }

  const cleanPhone = phone.replace(/\D/g, '');

  if (cleanPhone.length > PHONE_LENGTH) {
    return `El teléfono no puede tener más de ${PHONE_LENGTH} dígitos.`;
  }

  return undefined;
}

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
  } else if (!/[A-Z]/.test(values.password)) {
    errors.password = 'La contraseña debe tener al menos una mayúscula.';
  } else if (!/[0-9]/.test(values.password)) {
    errors.password = 'La contraseña debe tener al menos un número.';
  }

  if (requiresMember) {
    const fullName = values.fullName.trim();

    if (!fullName || fullName.length > 200) {
      errors.fullName =
        'Ingrese nombre y apellido, con un máximo de 200 caracteres.';
    }

    if (!isValidDNI(values.dni)) {
      errors.dni = `El DNI debe tener exactamente ${DNI_LENGTH} dígitos.`;
    }

    if (!isValidPhone(values.phone)) {
      errors.phone = `El teléfono debe tener exactamente ${PHONE_LENGTH} dígitos.`;
    }
  }

  return errors;
}
