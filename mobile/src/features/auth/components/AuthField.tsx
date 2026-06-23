import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '../../../components/ui/AppText';
import { Input } from '../../../components/ui/Input';
import { statusColors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';

type AuthFieldProps = ComponentProps<typeof Input> & {
  error?: string;
};

export function AuthField({ error, style, ...props }: AuthFieldProps) {
  return (
    <View style={styles.container}>
      <Input
        style={[style, error ? styles.inputError : undefined]}
        {...props}
      />
      {error ? (
        <AppText variant="caption" color={statusColors.error}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  inputError: {
    borderColor: statusColors.error,
  },
});
