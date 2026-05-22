import { Pressable, StyleSheet } from 'react-native';

import { AppText } from '../../../components/ui/AppText';
import { colors } from '../../../theme/colors';
import { radii, spacing } from '../../../theme/spacing';

export type DatePillProps = {
  weekday: string;
  day: string;
  month: string;
  selected: boolean;
  onPress: () => void;
};

export function DatePill({
  weekday,
  day,
  month,
  selected,
  onPress,
}: DatePillProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        selected && styles.selected,
        pressed && styles.pressed,
      ]}
    >
      <AppText
        variant="caption"
        color={selected ? colors.white : colors.blackOverlay}
        style={styles.weekday}
      >
        {weekday}
      </AppText>
      <AppText
        variant="body"
        color={selected ? colors.white : colors.black}
        style={styles.date}
      >
        {day} {month}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    minWidth: 84,
    minHeight: 66,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
  },
  selected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pressed: {
    opacity: 0.85,
  },
  weekday: {
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  date: {
    marginTop: spacing.xs,
    fontWeight: '700',
  },
});
