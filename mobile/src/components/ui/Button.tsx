import { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors } from '../../theme/colors';
import { radii, spacing } from '../../theme/spacing';
import { AppText } from './AppText';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
} & PropsWithChildren;

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  children,
}: ButtonProps) {
  const isGhost = variant === 'ghost';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <View style={styles.content}>
        <AppText
          variant="caption"
          color={isGhost ? colors.primary : colors.white}
          style={styles.text}
        >
          {title}
        </AppText>
        {children}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 42,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.accent,
  },
  ghost: {
    backgroundColor: 'transparent',
    paddingHorizontal: spacing.sm,
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.85,
  },
  text: {
    fontWeight: '700',
  },
});
