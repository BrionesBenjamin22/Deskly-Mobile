import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { AppText } from '../../../components/ui/AppText';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import {
  StatusModal,
  StatusModalType,
} from '../../../components/ui/StatusModal';
import { colors } from '../../../theme/colors';
import { radii, spacing } from '../../../theme/spacing';
import { AuthField } from '../components/AuthField';
import { PasswordRequirements } from '../components/PasswordRequirements';
import {
  AuthServiceError,
  BlockedAccountServiceError,
  InactiveAccountServiceError,
  getRegistrationStatus,
  login,
  register,
} from '../services/auth.service';
import { LoginResponse } from '../types/auth.types';
import {
  FormErrors,
  LoginFormValues,
  RegisterFormValues,
  validateLogin,
  validatePassword,
  validateRegister,
  getRealtimeDNIError,
  getRealtimePhoneError,
} from '../validation/auth.validation';

type AuthMode = 'login' | 'register';
type RequestStatus = 'idle' | 'loading' | 'success' | 'error';

type AuthScreenProps = {
  onAuthenticated: (session: LoginResponse) => void;
  initialFeedback?: {
    title: string;
    description: string;
  };
};

const initialLoginValues: LoginFormValues = {
  identifier: '',
  password: '',
};

const initialRegisterValues: RegisterFormValues = {
  email: '',
  username: '',
  password: '',
  fullName: '',
  dni: '',
  phone: '',
};

function getFriendlyError(error: unknown) {
  if (error instanceof AuthServiceError) {
    return error.message;
  }

  return 'Lo sentimos, no pudimos completar la solicitud. Revise los datos e intente nuevamente.';
}

export function AuthScreen({
  onAuthenticated,
  initialFeedback,
}: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [loginValues, setLoginValues] = useState(initialLoginValues);
  const [registerValues, setRegisterValues] = useState(initialRegisterValues);
  const [loginErrors, setLoginErrors] = useState<FormErrors<LoginFormValues>>(
    {},
  );
  const [registerErrors, setRegisterErrors] = useState<
    FormErrors<RegisterFormValues>
  >({});
  const [requestStatus, setRequestStatus] = useState<RequestStatus>(
    initialFeedback ? 'success' : 'idle',
  );
  const [statusMessage, setStatusMessage] = useState(
    initialFeedback?.description ?? '',
  );
  const [successTitle, setSuccessTitle] = useState(
    initialFeedback?.title ?? '',
  );
  const [errorTitle, setErrorTitle] = useState('No pudimos completar la solicitud');
  const [pendingSession, setPendingSession] = useState<LoginResponse | null>(
    null,
  );
  const [requiresMember, setRequiresMember] = useState<boolean | null>(null);
  const [registrationAvailable, setRegistrationAvailable] = useState<
    boolean | null
  >(null);
  const [registrationStatusError, setRegistrationStatusError] = useState<
    string | null
  >(null);

  const isSubmitting = requestStatus === 'loading';

  const loadRegistrationStatus = async () => {
    setRequiresMember(null);
    setRegistrationAvailable(null);
    setRegistrationStatusError(null);

    try {
      const status = await getRegistrationStatus();
      setRequiresMember(status.requiresMember);
      setRegistrationAvailable(status.registrationAvailable);
    } catch (error) {
      setRegistrationStatusError(getFriendlyError(error));
    }
  };

  const changeMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setLoginErrors({});
    setRegisterErrors({});
    setRequestStatus('idle');
    setSuccessTitle('');
    setPendingSession(null);

    if (nextMode === 'register') {
      void loadRegistrationStatus();
    }
  };

  const handleLogin = async () => {
    const errors = validateLogin(loginValues);
    setLoginErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setRequestStatus('loading');
    setStatusMessage('Estamos validando sus credenciales.');

    try {
      const session = await login(loginValues);
      setPendingSession(session);
      setSuccessTitle('Bienvenido a Deskly');
      setStatusMessage(`Bienvenido, ${session.user.username}.`);
      setRequestStatus('success');
    } catch (error) {
      const isBlocked =
        error instanceof BlockedAccountServiceError ||
        (error instanceof Error && error.name === 'BlockedAccountServiceError');
      const isInactive =
        error instanceof InactiveAccountServiceError ||
        (error instanceof Error && error.name === 'InactiveAccountServiceError');

      if (isBlocked) {
        setErrorTitle('Cuenta bloqueada');
      } else if (isInactive) {
        setErrorTitle('Cuenta desactivada');
      } else {
        setErrorTitle('No pudimos completar la solicitud');
      }
      setStatusMessage(getFriendlyError(error));
      setRequestStatus('error');
    }
  };

  const handleRegister = async () => {
    if (requiresMember === null || registrationAvailable === null) {
      setStatusMessage(
        'Lo sentimos, no pudimos verificar los requisitos del registro. Intente nuevamente.',
      );
      setRequestStatus('error');
      return;
    }
    if (!registrationAvailable) {
      setStatusMessage(
        'Lo sentimos, un responsable debe inicializar el sistema antes de habilitar registros.',
      );
      setRequestStatus('error');
      return;
    }

    const errors = validateRegister(registerValues, requiresMember);
    setRegisterErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setRequestStatus('loading');
    setStatusMessage('Estamos creando su cuenta.');

    try {
      await register({
        email: registerValues.email,
        username: registerValues.username,
        password: registerValues.password,
        ...(requiresMember
          ? {
              member: {
                fullName: registerValues.fullName,
                dni: Number(registerValues.dni),
                phone: Number(registerValues.phone),
              },
            }
          : {}),
      });
      setLoginValues({
        identifier: registerValues.email.trim(),
        password: '',
      });
      setRegisterValues(initialRegisterValues);
      setRequiresMember(true);
      setMode('login');
      setSuccessTitle('Cuenta creada');
      setStatusMessage(
        'Su cuenta fue creada correctamente. Ya puede iniciar sesión.',
      );
      setRequestStatus('success');
    } catch (error) {
      setStatusMessage(getFriendlyError(error));
      setRequestStatus('error');
    }
  };

  const closeStatus = () => {
    if (pendingSession) {
      onAuthenticated(pendingSession);
      return;
    }

    setRequestStatus('idle');
    setSuccessTitle('');
  };

  const modalContent = getModalContent(
    requestStatus,
    statusMessage,
    mode,
    successTitle,
    errorTitle,
  );

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardArea}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brand}>
            <Image
              source={require('../../../../assets/new-logo-deskly.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <View style={styles.brandCopy}>
              <AppText variant="title" color={colors.primary}>
                Deskly
              </AppText>
              <AppText variant="body" color={colors.primaryLight}>
                Su espacio de trabajo, más simple.
              </AppText>
            </View>
          </View>

          <Card style={styles.card}>
            <View style={styles.heading}>
              <AppText variant="subtitle" color={colors.primary}>
                {mode === 'login' ? 'Iniciar sesión' : 'Crear una cuenta'}
              </AppText>
              <AppText variant="body" color={colors.primaryLight}>
                {mode === 'login'
                  ? 'Ingrese sus credenciales para continuar.'
                  : registrationAvailable === false
                    ? 'El registro estara disponible cuando un responsable inicialice el sistema.'
                    : requiresMember === true
                      ? 'Complete sus datos para registrarse como miembro.'
                      : 'Estamos verificando los requisitos del registro.'}
              </AppText>
            </View>

            {mode === 'login' ? (
              <LoginForm
                values={loginValues}
                errors={loginErrors}
                disabled={isSubmitting}
                onChange={(field, value) => {
                  setLoginValues((current) => ({ ...current, [field]: value }));
                  setLoginErrors((current) => ({
                    ...current,
                    [field]: undefined,
                  }));
                }}
                onSubmit={handleLogin}
              />
            ) : requiresMember === null || registrationAvailable === null ? (
              <View style={styles.registrationStatus}>
                <AppText variant="body" color={colors.primaryLight}>
                  {registrationStatusError ??
                    'Consultando el estado actual del sistema...'}
                </AppText>
                {registrationStatusError ? (
                  <Button
                    variant="ghost"
                    title="Intentar nuevamente"
                    onPress={() => void loadRegistrationStatus()}
                  />
                ) : null}
              </View>
            ) : registrationAvailable === false ? (
              <View style={styles.registrationStatus}>
                <AppText variant="body" color={colors.primaryLight}>
                  Un responsable debe ejecutar la inicializacion administrativa
                  desde el backend antes de habilitar nuevas cuentas.
                </AppText>
              </View>
            ) : (
              <RegisterForm
                values={registerValues}
                errors={registerErrors}
                requiresMember={requiresMember}
                disabled={isSubmitting}
                onChange={(field, value) => {
                  setRegisterValues((current) => ({
                    ...current,
                    [field]: value,
                  }));

                  let realtimeError: string | undefined = undefined;
                  if (field === 'dni') {
                    realtimeError = getRealtimeDNIError(value);
                  } else if (field === 'phone') {
                    realtimeError = getRealtimePhoneError(value);
                  }

                  setRegisterErrors((current) => ({
                    ...current,
                    [field]: realtimeError,
                  }));
                }}
                onSubmit={handleRegister}
              />
            )}

            <View style={styles.switchMode}>
              <AppText variant="caption" color={colors.primaryLight}>
                {mode === 'login'
                  ? '¿Todavía no tiene una cuenta?'
                  : '¿Ya tiene una cuenta?'}
              </AppText>
              <Button
                variant="ghost"
                title={mode === 'login' ? 'Registrarse' : 'Iniciar sesión'}
                disabled={isSubmitting}
                onPress={() =>
                  changeMode(mode === 'login' ? 'register' : 'login')
                }
              />
            </View>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>

      {modalContent ? (
        <StatusModal
          visible
          type={modalContent.type}
          title={modalContent.title}
          description={modalContent.description}
          onClose={requestStatus === 'loading' ? undefined : closeStatus}
        />
      ) : null}
    </ScreenContainer>
  );
}

type LoginFormProps = {
  values: LoginFormValues;
  errors: FormErrors<LoginFormValues>;
  disabled: boolean;
  onChange: (field: keyof LoginFormValues, value: string) => void;
  onSubmit: () => void;
};

function LoginForm({
  values,
  errors,
  disabled,
  onChange,
  onSubmit,
}: LoginFormProps) {
  return (
    <View style={styles.form}>
      <AuthField
        label="Email o usuario"
        placeholder="nombre@ejemplo.com"
        value={values.identifier}
        error={errors.identifier}
        autoCapitalize="none"
        autoCorrect={false}
        editable={!disabled}
        required
        onChangeText={(value) => onChange('identifier', value)}
      />
      <AuthField
        label="Contraseña"
        placeholder="Ingrese su contraseña"
        value={values.password}
        error={errors.password}
        secureTextEntry
        editable={!disabled}
        required
        onChangeText={(value) => onChange('password', value)}
        onSubmitEditing={onSubmit}
      />
      <PasswordRequirements password={values.password} />
      <Button title="Ingresar" disabled={disabled} onPress={onSubmit} />
    </View>
  );
}

type RegisterFormProps = {
  values: RegisterFormValues;
  errors: FormErrors<RegisterFormValues>;
  disabled: boolean;
  requiresMember: boolean;
  onChange: (field: keyof RegisterFormValues, value: string) => void;
  onSubmit: () => void;
};

function RegisterForm({
  values,
  errors,
  disabled,
  requiresMember,
  onChange,
  onSubmit,
}: RegisterFormProps) {
  return (
    <View style={styles.form}>
      <AuthField
        label="Email"
        placeholder="nombre@ejemplo.com"
        value={values.email}
        error={errors.email}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        editable={!disabled}
        required
        onChangeText={(value) => onChange('email', value)}
      />
      <AuthField
        label="Nombre de usuario"
        placeholder="nombre.usuario"
        value={values.username}
        error={errors.username}
        autoCapitalize="none"
        autoCorrect={false}
        editable={!disabled}
        required
        onChangeText={(value) => onChange('username', value)}
      />
      <AuthField
        label="Contraseña"
        placeholder="Entre 8 y 72 caracteres"
        value={values.password}
        error={errors.password}
        secureTextEntry
        editable={!disabled}
        required
        onChangeText={(value) => onChange('password', value)}
      />
      <PasswordRequirements password={values.password} />
      {requiresMember ? (
        <>
          <AuthField
            label="Nombre Completo"
            placeholder="Nombre Completo"
            value={values.fullName}
            error={errors.fullName}
            autoCapitalize="words"
            editable={!disabled}
            required
            onChangeText={(value) => onChange('fullName', value)}
          />
          <View style={styles.row}>
            <View style={styles.rowField}>
              <AuthField
                label="DNI"
                placeholder="12345678"
                value={values.dni}
                error={errors.dni}
                keyboardType="number-pad"
                editable={!disabled}
                required
                onChangeText={(value) => onChange('dni', value)}
              />
            </View>
            <View style={styles.rowField}>
              <AuthField
                label="Teléfono"
                placeholder="1123456789"
                value={values.phone}
                error={errors.phone}
                keyboardType="phone-pad"
                editable={!disabled}
                required
                onChangeText={(value) => onChange('phone', value)}
              />
            </View>
          </View>
        </>
      ) : null}
      <Button title="Crear cuenta" disabled={disabled} onPress={onSubmit} />
    </View>
  );
}

function getModalContent(
  status: RequestStatus,
  message: string,
  mode: AuthMode,
  successTitle: string,
  errorTitle = 'No pudimos completar la solicitud',
): { type: StatusModalType; title: string; description: string } | null {
  if (status === 'idle') {
    return null;
  }

  if (status === 'loading') {
    return {
      type: 'loading',
      title: mode === 'login' ? 'Iniciando sesión...' : 'Creando cuenta...',
      description: message,
    };
  }

  if (status === 'success') {
    return {
      type: 'success',
      title: successTitle,
      description: message,
    };
  }

  return {
    type: 'error',
    title: errorTitle,
    description: message,
  };
}

const styles = StyleSheet.create({
  keyboardArea: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: spacing.xxl,
  },
  brand: {
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  logo: {
    borderRadius: radii.lg,
    height: 72,
    width: 72,
  },
  brandCopy: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  card: {
    gap: spacing.xl,
    maxWidth: 480,
    width: '100%',
  },
  heading: {
    gap: spacing.xs,
  },
  form: {
    gap: spacing.lg,
  },
  registrationStatus: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  rowField: {
    flex: 1,
    minWidth: 0,
  },
  switchMode: {
    alignItems: 'center',
    borderTopColor: colors.border,
    borderTopWidth: 1,
    gap: spacing.xs,
    paddingTop: spacing.md,
  },
});
