import { PropsWithChildren } from 'react';
import { StyleProp, StyleSheet, Text, TextStyle } from 'react-native';

import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type AppTextVariant = 'title' | 'subtitle' | 'body' | 'caption';

type AppTextProps = PropsWithChildren<{
  variant?: AppTextVariant;
  color?: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}>;

export function AppText({
  children,
  variant = 'body',
  color = colors.black,
  style,
  numberOfLines,
}: AppTextProps) {
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[styles.base, typography[variant], { color }, style]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    letterSpacing: 0,
  },
});
