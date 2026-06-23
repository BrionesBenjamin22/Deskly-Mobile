import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../../../components/ui/AppText';
import { Card } from '../../../components/ui/Card';
import { Icon } from '../../../components/ui/Icon';
import { colors, statusColors } from '../../../theme/colors';
import { radii, spacing } from '../../../theme/spacing';
import { useProfilePenalties } from '../hooks/useProfilePenalties';
import { Penalty, PenaltyType } from '../types/penalty.types';

const typeLabels: Record<PenaltyType, string> = {
  ABSENCE: 'Ausencia',
  LATE_CANCELLATION: 'Cancelacion tardia',
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
}

function PenaltyDetail({ penalty }: { penalty: Penalty }) {
  return (
    <View style={styles.detail}>
      <View style={styles.detailHeader}>
        <AppText variant="caption" color={colors.primary} style={styles.detailTitle}>
          {typeLabels[penalty.type]}
        </AppText>
        <AppText variant="caption" color={statusColors.warning}>
          Activa hasta {formatDate(penalty.activeUntil)}
        </AppText>
      </View>
      <AppText variant="body" color={colors.primaryLight}>{penalty.reason}</AppText>
      <AppText variant="caption" color={colors.blackOverlay}>
        Registrada el {formatDate(penalty.registeredAt)}
      </AppText>
    </View>
  );
}

export function ProfilePenaltiesCard({ accessToken }: { accessToken: string }) {
  const [expanded, setExpanded] = useState(false);
  const penalties = useProfilePenalties(accessToken);

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Icon name="circleAlert" size={20} color={statusColors.warning} />
          <AppText variant="subtitle" color={colors.primary}>Penalizaciones activas</AppText>
        </View>
        <View style={styles.counter}>
          <AppText variant="subtitle" color={colors.white} style={styles.counterText}>
            {penalties.isLoading ? '...' : String(penalties.total)}
          </AppText>
        </View>
      </View>

      <AppText variant="body" color={colors.primaryLight}>
        Las penalizaciones permanecen activas durante un mes y pueden afectar el acceso a la cuenta.
      </AppText>

      {penalties.errorMessage ? (
        <Pressable accessibilityRole="button" onPress={() => void penalties.refresh()}>
          <AppText variant="caption" color={statusColors.error} style={styles.actionText}>
            No pudimos recuperar la informacion. Reintentar
          </AppText>
        </Pressable>
      ) : penalties.total > 0 ? (
        <Pressable accessibilityRole="button" onPress={() => setExpanded((current) => !current)}>
          <AppText variant="caption" color={colors.accent} style={styles.actionText}>
            {expanded ? 'Ocultar detalle' : 'Ver penalizaciones'}
          </AppText>
        </Pressable>
      ) : (
        <AppText variant="caption" color={statusColors.success} style={styles.clearText}>
          No tiene penalizaciones activas.
        </AppText>
      )}

      {expanded ? (
        <View style={styles.details}>
          {penalties.penalties.map((penalty) => (
            <PenaltyDetail key={penalty.penaltyId} penalty={penalty} />
          ))}
          {penalties.total > penalties.penalties.length ? (
            <AppText variant="caption" color={colors.primaryLight}>
              Se muestran las 3 penalizaciones activas mas recientes.
            </AppText>
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  titleRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  counter: { alignItems: 'center', backgroundColor: statusColors.warning, borderRadius: radii.pill, justifyContent: 'center', minHeight: 36, minWidth: 36, paddingHorizontal: spacing.sm },
  counterText: { fontWeight: '900' },
  actionText: { fontWeight: '800', paddingVertical: spacing.xs },
  clearText: { fontWeight: '700' },
  details: { borderTopColor: colors.border, borderTopWidth: 1, gap: spacing.md, paddingTop: spacing.md },
  detail: { backgroundColor: colors.background, borderRadius: radii.md, gap: spacing.xs, padding: spacing.md },
  detailHeader: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'space-between' },
  detailTitle: { fontWeight: '800' },
});
