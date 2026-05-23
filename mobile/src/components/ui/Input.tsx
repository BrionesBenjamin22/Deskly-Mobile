import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';

import { colors } from '../../theme/colors';
import { radii, spacing } from '../../theme/spacing';
import { AppText } from './AppText';

type InputProps = TextInputProps & {
  label: string;
};

export function Input({ label, style, ...props }: InputProps) {
  return (
    <View style={styles.container}>
      <AppText variant="caption" color={colors.blackOverlay} style={styles.label}>
        {label}
      </AppText>
      <TextInput
        placeholderTextColor={colors.primaryLight}
        style={[styles.input, style]}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: spacing.xs,
  },
  label: {
    fontWeight: '700',
  },
  input: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.black,
    fontSize: 15,
    minHeight: 44,
    paddingHorizontal: spacing.md,
  },
});
