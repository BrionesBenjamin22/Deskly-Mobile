import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { AppText } from '../../../components/ui/AppText';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { StatusModal } from '../../../components/ui/StatusModal';
import { colors } from '../../../theme/colors';
import { radii, spacing } from '../../../theme/spacing';
import { AuthField } from './AuthField';
import { AuthServiceError, changePassword } from '../services/auth.service';

type Props = {
  visible: boolean;
  accessToken: string;
  onClose: () => void;
};

type FormValues = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

type FormErrors = Partial<FormValues>;

function validatePassword(values: FormValues): FormErrors {
  const errors: FormErrors = {};

  if (!values.currentPassword) {
    errors.currentPassword = 'Ingrese su contraseña actual.';
  }

  if (!values.newPassword) {
    errors.newPassword = 'Ingrese la nueva contraseña.';
  } else if (values.newPassword.length < 8) {
    errors.newPassword = 'La contraseña debe tener al menos 8 caracteres.';
  } else if (!/[A-Z]/.test(values.newPassword)) {
    errors.newPassword = 'La contraseña debe tener al menos una mayúscula.';
  } else if (!/[0-9]/.test(values.newPassword)) {
    errors.newPassword = 'La contraseña debe tener al menos un número.';
  } else if (values.newPassword === values.currentPassword) {
    errors.newPassword = 'La nueva contraseña debe ser diferente a la actual.';
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = 'Confirme la nueva contraseña.';
  } else if (values.confirmPassword !== values.newPassword) {
    errors.confirmPassword = 'Las contraseñas no coinciden.';
  }

  return errors;
}

function getRealtimeNewPasswordError(value: string): string | undefined {
  if (value.length === 0) return undefined;
  if (value.length < 8) return 'Mínimo 8 caracteres.';
  if (!/[A-Z]/.test(value)) return 'Debe incluir al menos una mayúscula.';
  if (!/[0-9]/.test(value)) return 'Debe incluir al menos un número.';
  return undefined;
}

function getRealtimeConfirmError(
  value: string,
  newPassword: string,
): string | undefined {
  if (value.length === 0) return undefined;
  if (value !== newPassword) return 'Las contraseñas no coinciden.';
  return undefined;
}

const initialValues: FormValues = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

type RequestStatus = 'idle' | 'loading' | 'success' | 'error';

export function ChangePasswordModal({ visible, accessToken, onClose }: Props) {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<RequestStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const isSubmitting = status === 'loading';

  const handleChange = (field: keyof FormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));

    if (field === 'newPassword') {
      setErrors((prev) => ({
        ...prev,
        newPassword: getRealtimeNewPasswordError(value),
        confirmPassword:
          values.confirmPassword
            ? getRealtimeConfirmError(values.confirmPassword, value)
            : undefined,
      }));
    }

    if (field === 'confirmPassword') {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: getRealtimeConfirmError(value, values.newPassword),
      }));
    }
  };

  const handleSubmit = async () => {
    const validationErrors = validatePassword(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setStatus('loading');
    try {
      await changePassword(accessToken, {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      setStatus('success');
    } catch (error) {
      setErrorMessage(
        error instanceof AuthServiceError
          ? error.message
          : 'Lo sentimos, no pudimos cambiar su contraseña. Intente nuevamente.',
      );
      setStatus('error');
    }
  };

  const handleClose = () => {
    setValues(initialValues);
    setErrors({});
    setStatus('idle');
    setErrorMessage('');
    onClose();
  };

  return (
    <>
      <Modal
        visible={visible && status === 'idle'}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
      >
        <Pressable style={styles.backdrop} onPress={handleClose}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardArea}
          >
            <Pressable onPress={() => {}}>
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
              >
                <Card style={styles.card}>
                  <View style={styles.header}>
                    <AppText variant="subtitle" color={colors.primary}>
                      Cambiar contraseña
                    </AppText>
                    <AppText variant="body" color={colors.primaryLight}>
                      Ingrese su contraseña actual y elija una nueva.
                    </AppText>
                  </View>

                  <View style={styles.form}>
                    <AuthField
                      label="Contraseña actual"
                      placeholder="Ingrese su contraseña actual"
                      value={values.currentPassword}
                      error={errors.currentPassword}
                      secureTextEntry
                      editable={!isSubmitting}
                      required
                      onChangeText={(v) => handleChange('currentPassword', v)}
                    />
                    <AuthField
                      label="Nueva contraseña"
                      placeholder="Mínimo 8 caracteres"
                      value={values.newPassword}
                      error={errors.newPassword}
                      secureTextEntry
                      editable={!isSubmitting}
                      required
                      onChangeText={(v) => handleChange('newPassword', v)}
                    />
                    <AuthField
                      label="Confirmar nueva contraseña"
                      placeholder="Repita la nueva contraseña"
                      value={values.confirmPassword}
                      error={errors.confirmPassword}
                      secureTextEntry
                      editable={!isSubmitting}
                      required
                      onChangeText={(v) => handleChange('confirmPassword', v)}
                      onSubmitEditing={() => void handleSubmit()}
                    />
                  </View>

                  <View style={styles.actions}>
                    <Button
                      title="Guardar cambios"
                      disabled={isSubmitting}
                      onPress={() => void handleSubmit()}
                    />
                    <Button
                      title="Cancelar"
                      variant="ghost"
                      disabled={isSubmitting}
                      onPress={handleClose}
                    />
                  </View>
                </Card>
              </ScrollView>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>

      <StatusModal
        visible={status === 'loading'}
        type="loading"
        title="Cambiando contraseña..."
        description="Estamos actualizando su contraseña."
        onClose={undefined}
      />

      <StatusModal
        visible={status === 'success'}
        type="success"
        title="Contraseña actualizada"
        description="Su contraseña fue cambiada correctamente."
        onClose={handleClose}
      />

      <StatusModal
        visible={status === 'error'}
        type="error"
        title="No pudimos cambiar su contraseña"
        description={errorMessage}
        onClose={() => setStatus('idle')}
      />
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.screenX,
  },
  keyboardArea: {
    justifyContent: 'center',
  },
  scrollContent: {
    paddingVertical: spacing.xl,
  },
  card: {
    gap: spacing.lg,
  },
  header: {
    gap: spacing.xs,
  },
  form: {
    gap: spacing.md,
  },
  actions: {
    gap: spacing.sm,
  },
});
