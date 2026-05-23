import { StyleSheet, View } from 'react-native';

import { colors } from '../../theme/colors';
import { radii, spacing } from '../../theme/spacing';
import { AppText } from './AppText';
import { Icon } from './Icon';

export function EmptyState() {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Icon name="search" size={28} color={colors.primary} />
      </View>
      <AppText variant="subtitle" style={styles.title}>
        No hay escritorios disponibles para estos filtros
      </AppText>
      <AppText variant="body" color={colors.blackOverlay} style={styles.copy}>
        Intenta con otra fecha u horario
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
