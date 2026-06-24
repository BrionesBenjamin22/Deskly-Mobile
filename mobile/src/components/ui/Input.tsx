import {
  StyleProp,
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';

import { colors, statusColors } from '../../theme/colors';
import { radii, spacing } from '../../theme/spacing';
import { AppText } from './AppText';

type InputProps = TextInputProps & {
  label: string;
  containerStyle?: StyleProp<ViewStyle>;
  required?: boolean;
};

export function Input({ label, containerStyle, style, required, ...props }: InputProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.labelContainer}>
        <AppText variant="caption" color={colors.blackOverlay} style={styles.label}>
          {label}
        </AppText>
        {required && (
          <AppText variant="caption" color={statusColors.error} style={styles.required}>
            *
          </AppText>
        )}
      </View>
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
    gap: spacing.xs,
  },
  labelContainer: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  label: {
    fontWeight: '700',
  },
  required: {
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
