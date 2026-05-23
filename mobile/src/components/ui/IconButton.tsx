import { Pressable, StyleSheet } from 'react-native';

import { colors } from '../../theme/colors';
import { radii } from '../../theme/spacing';
import { Icon, IconName } from './Icon';

type IconButtonProps = {
  accessibilityLabel: string;
  icon: IconName;
  onPress: () => void;
};

export function IconButton({
  accessibilityLabel,
  icon,
  onPress,
}: IconButtonProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Icon name={icon} size={22} color={colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: radii.pill,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  pressed: {
    backgroundColor: colors.background,
  },
});
