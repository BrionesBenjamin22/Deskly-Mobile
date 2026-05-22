import { StyleSheet, View } from 'react-native';

import { AppText } from '../../../components/ui/AppText';
import { Icon } from '../../../components/ui/Icon';
import { colors } from '../../../theme/colors';
import { radii, spacing } from '../../../theme/spacing';

export function ReservationEmptyState() {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Icon name="calendar" size={28} color={colors.primary} />
      </View>
      <AppText variant="subtitle" style={styles.title}>
        No tenés reservas todavía
      </AppText>
      <AppText variant="body" color={colors.blackOverlay} style={styles.copy}>
        Explorá los escritorios disponibles y hacé tu primera reserva
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
