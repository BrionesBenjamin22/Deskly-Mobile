import { StyleSheet, View } from 'react-native';

import { AppText } from '../../../components/ui/AppText';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';

const requirements = [
  {
    label: 'Entre 8 y 72 caracteres',
    validate: (password: string) =>
      password.length >= 8 && password.length <= 72,
  },
  {
    label: 'Al menos una letra mayúscula',
    validate: (password: string) => /[A-Z]/.test(password),
  },
  {
    label: 'Al menos un número',
    validate: (password: string) => /[0-9]/.test(password),
  },
] as const;

export function getPendingPasswordRequirements(password: string): string[] {
  return requirements
    .filter((requirement) => !requirement.validate(password))
    .map((requirement) => requirement.label);
}

export function PasswordRequirements({ password }: { password: string }) {
  const pending = getPendingPasswordRequirements(password);
  if (pending.length === 0) return null;

  return (
    <View
      accessibilityLabel="Requisitos pendientes de la contraseña"
      accessibilityLiveRegion="polite"
      style={styles.container}
    >
      {pending.map((requirement) => (
        <AppText
          key={requirement}
          variant="caption"
          color={colors.primaryLight}
        >
          • {requirement}
        </AppText>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
    marginTop: -spacing.sm,
  },
});
