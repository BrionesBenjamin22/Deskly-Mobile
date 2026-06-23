import { StyleSheet, View } from 'react-native';

import { AppText } from '../../../components/ui/AppText';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';

type ProfileDetailRowProps = {
  label: string;
  value: string;
};

export function ProfileDetailRow({ label, value }: ProfileDetailRowProps) {
  return (
    <View style={styles.row}>
      <AppText variant="caption" color={colors.primaryLight}>
        {label}
      </AppText>
      <AppText variant="body" color={colors.primary} style={styles.value}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  value: {
    fontWeight: '700',
  },
});
