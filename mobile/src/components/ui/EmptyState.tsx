import { StyleSheet, View } from 'react-native';

import { colors } from '../../theme/colors';
import { radii, spacing } from '../../theme/spacing';
import { AppText } from './AppText';

export function EmptyState() {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <View style={styles.lens} />
        <View style={styles.handle} />
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
  lens: {
    borderColor: colors.primary,
    borderRadius: 10,
    borderWidth: 2,
    height: 20,
    width: 20,
  },
  handle: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    height: 12,
    marginLeft: 18,
    marginTop: -2,
    transform: [{ rotate: '-45deg' }],
    width: 2,
  },
  title: {
    textAlign: 'center',
  },
  copy: {
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
