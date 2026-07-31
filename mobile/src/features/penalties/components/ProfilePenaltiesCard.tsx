import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../../../components/ui/AppText';
import { Card } from '../../../components/ui/Card';
import { Icon } from '../../../components/ui/Icon';
import { colors, statusColors } from '../../../theme/colors';
import { radii, spacing } from '../../../theme/spacing';
import { useAuth } from '../../auth/context/AuthContext';
import { useProfilePenalties } from '../hooks/useProfilePenalties';
import {
  InfractionLevel,
  Penalty,
  PenaltyType,
} from '../types/penalty.types';

const typeLabels: Record<PenaltyType, string> = {
  ABSENCE: 'Ausencia',
  LATE_CANCELLATION: 'Cancelacion tardia',
};

const levelLabels: Record<InfractionLevel, string> = {
  WARNING: 'Advertencia',
  PENALTY: 'Penalizacion',
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
        <View style={styles.detailHeading}>
          <AppText variant="caption" color={colors.primary} style={styles.detailTitle}>
            {typeLabels[penalty.type]}
          </AppText>
          <View
            style={[
              styles.levelBadge,
              penalty.level === 'WARNING'
                ? styles.warningBadge
                : styles.penaltyBadge,
            ]}
          >
            <AppText
              variant="caption"
              color={
                penalty.level === 'WARNING'
                  ? statusColors.warning
                  : statusColors.error
              }
              style={styles.levelText}
            >
              {levelLabels[penalty.level]}
            </AppText>
          </View>
        </View>
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

export function ProfilePenaltiesCard({
  refreshKey = 0,
}: {
  refreshKey?: number;
}) {
  const { accessToken } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const penalties = useProfilePenalties(accessToken, refreshKey);

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Icon name="circleAlert" size={20} color={statusColors.warning} />
          <AppText variant="subtitle" color={colors.primary}>
            Advertencias y penalizaciones
          </AppText>
        </View>
        <View style={styles.counter}>
          <AppText variant="subtitle" color={colors.white} style={styles.counterText}>
            {penalties.isLoading ? '...' : String(penalties.total)}
          </AppText>
        </View>
      </View>

      <AppText variant="body" color={colors.primaryLight}>
        Los antecedentes permanecen activos durante un mes. Las penalizaciones acumuladas pueden afectar el acceso a la cuenta.
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
            {expanded ? 'Ocultar detalle' : 'Ver antecedentes'}
          </AppText>
        </Pressable>
      ) : (
        <AppText variant="caption" color={statusColors.success} style={styles.clearText}>
          No tiene advertencias ni penalizaciones activas.
        </AppText>
      )}

      {expanded ? (
        <View style={styles.details}>
          {penalties.penalties.map((penalty) => (
            <PenaltyDetail key={penalty.penaltyId} penalty={penalty} />
          ))}
          {penalties.total > penalties.penalties.length ? (
            <AppText variant="caption" color={colors.primaryLight}>
              Se muestran los 3 antecedentes activos mas recientes.
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
  detailHeading: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  detailTitle: { fontWeight: '800' },
  levelBadge: { borderRadius: radii.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  warningBadge: { backgroundColor: '#FFF7E6' },
  penaltyBadge: { backgroundColor: statusColors.errorSoft },
  levelText: { fontWeight: '800' },
});
