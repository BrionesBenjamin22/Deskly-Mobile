import { StyleSheet, View } from 'react-native';

import { AppText } from '../../../components/ui/AppText';
import { Icon, IconName } from '../../../components/ui/Icon';
import { colors } from '../../../theme/colors';
import { radii, spacing } from '../../../theme/spacing';

type DesksFeedbackCardProps = {
  icon: IconName;
  title: string;
  description: string;
};

export function DesksFeedbackCard({
  icon,
  title,
  description,
}: DesksFeedbackCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Icon name={icon} size={28} color={colors.primary} />
      </View>
      <AppText variant="subtitle" style={styles.title}>
        {title}
      </AppText>
      <AppText variant="body" color={colors.blackOverlay} style={styles.copy}>
        {description}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    marginTop: spacing.lg,
    padding: spacing.xxl,
  },
  iconCircle: {
    alignItems: 'center',
    backgroundColor: colors.softMint,
    borderRadius: 32,
    height: 64,
    justifyContent: 'center',
    marginBottom: spacing.lg,
    width: 64,
  },
  title: {
    textAlign: 'center',
  },
  copy: {
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
