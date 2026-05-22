import { StyleProp, StyleSheet, Text, TextStyle } from 'react-native';

import { colors } from '../../theme/colors';

export type IconName =
  | 'building'
  | 'calendar'
  | 'chevronRight'
  | 'clock'
  | 'filter'
  | 'logout'
  | 'mapPin'
  | 'search'
  | 'user'
  | 'users'
  | 'x';

type IconProps = {
  name: IconName;
  color?: string;
  size?: number;
  style?: StyleProp<TextStyle>;
};

const glyphs: Record<IconName, string> = {
  building: '⌂',
  calendar: '□',
  chevronRight: '›',
  clock: '◷',
  filter: '≡',
  logout: '↪',
  mapPin: '⌖',
  search: '⌕',
  user: '○',
  users: '◎',
  x: '×',
};

export function Icon({
  name,
  color = colors.primary,
  size = 18,
  style,
}: IconProps) {
  return (
    <Text
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={[styles.icon, { color, fontSize: size, lineHeight: size + 2 }, style]}
    >
      {glyphs[name]}
    </Text>
  );
}

const styles = StyleSheet.create({
  icon: {
    fontWeight: '700',
    letterSpacing: 0,
    textAlign: 'center',
  },
});
