import { StyleSheet, View } from 'react-native';

import { AppText } from '../../../components/ui/AppText';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { Locality, WorkArea } from '../types/desk.types';
import { WorkAreaCard } from './WorkAreaCard';

type LocalitySectionProps = {
  locality: Locality;
  areas: WorkArea[];
  expandedAreaId: string | null;
  onToggleArea: (areaId: string) => void;
  onReserveArea: (area: WorkArea) => void;
};

export function LocalitySection({
  locality,
  areas,
  expandedAreaId,
  onToggleArea,
  onReserveArea,
}: LocalitySectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <AppText variant="subtitle" color={colors.primary} style={styles.title}>
          {locality.name}
        </AppText>
        <AppText variant="caption" color={colors.primaryLight} style={styles.count}>
          {areas.length} {areas.length === 1 ? 'area' : 'areas'}
        </AppText>
      </View>

      {areas.length > 0 ? (
        <View style={styles.list}>
          {areas.map((area) => (
            <WorkAreaCard
              key={area.id}
              area={area}
              expanded={expandedAreaId === area.id}
              onToggle={() => onToggleArea(area.id)}
              onReserve={onReserveArea}
            />
          ))}
        </View>
      ) : (
        <AppText variant="caption" color={colors.blackOverlay}>
          No hay areas disponibles para esta localidad.
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.md,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    fontWeight: '800',
  },
  count: {
    fontWeight: '700',
  },
  list: {
    gap: spacing.md,
  },
});
