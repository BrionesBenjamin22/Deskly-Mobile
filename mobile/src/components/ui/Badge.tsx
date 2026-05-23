import { StyleSheet, View } from 'react-native';

import { colors } from '../../theme/colors';
import { radii, spacing } from '../../theme/spacing';
import { AppText } from './AppText';

type BadgeProps = {
  label: string;
  tone?: 'neutral' | 'success';
};

export function Badge({ label, tone = 'neutral' }: BadgeProps) {
  const isSuccess = tone === 'success';

  return (
    <View style={[styles.badge, isSuccess && styles.success]}>
      <AppText
        variant="caption"
        color={isSuccess ? colors.primary : colors.blackOverlay}
      >
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.gray,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  success: {
    backgroundColor: colors.softMint,
    borderColor: colors.primaryLight,
  },
});
