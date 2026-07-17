import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../../../components/ui/AppText';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Icon } from '../../../components/ui/Icon';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { WorkArea } from '../types/desk.types';
import { LocationMap } from './LocationMap';

type WorkAreaCardProps = {
  area: WorkArea;
  expanded: boolean;
  onToggle: () => void;
  onReserve: (area: WorkArea) => void;
};

function getAvailabilityLabel(area: WorkArea) {
  const count = area.availableDeskCount ?? 0;

  if (count <= 0) {
    return 'Sin disponibilidad';
  }

  return count === 1 ? '1 disponible' : `${count} disponibles`;
}

export function WorkAreaCard({
  area,
  expanded,
  onToggle,
  onReserve,
}: WorkAreaCardProps) {
  const availableDeskCount = area.availableDeskCount ?? 0;
  const totalDeskCount = area.totalDeskCount ?? 0;
  const isAvailable = availableDeskCount > 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      onPress={onToggle}
      style={({ pressed }) => pressed && styles.pressed}
    >
      <Card style={styles.card}>
        <View style={styles.header}>
          <View style={styles.titleBlock}>
            <AppText variant="subtitle" color={colors.primary} style={styles.title}>
              {area.name}
            </AppText>
            <AppText variant="caption" color={colors.blackOverlay}>
              {area.description ?? 'Area de trabajo disponible para reservas.'}
            </AppText>
          </View>

          <Badge
            label={getAvailabilityLabel(area)}
            tone={isAvailable ? 'success' : 'neutral'}
          />
        </View>

        {expanded ? (
          <View style={styles.details}>
            <View style={styles.detailRow}>
              <Icon name="mapPin" size={16} color={colors.primaryLight} />
              <AppText variant="caption" color={colors.primaryLight} style={styles.detailText}>
                {area.locality?.name ?? 'Localidad sin asignar'}
              </AppText>
            </View>

            <View style={styles.detailRow}>
              <Icon name="users" size={16} color={colors.primaryLight} />
              <AppText variant="caption" color={colors.primaryLight} style={styles.detailText}>
                {availableDeskCount} de {totalDeskCount} escritorios disponibles
              </AppText>
            </View>

            {area.address ? (
              <View style={styles.detailRow}>
                <Icon name="mapPin" size={16} color={colors.primaryLight} />
                <AppText variant="caption" color={colors.primaryLight} style={styles.detailText}>
                  {area.address}
                </AppText>
              </View>
            ) : null}

            <LocationMap
              latitude={area.latitude}
              longitude={area.longitude}
              title={area.name}
              description={area.address ?? area.locality?.name}
            />

            <Button
              title="Reservar"
              disabled={!isAvailable}
              onPress={() => onReserve(area)}
            />
          </View>
        ) : null}
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  titleBlock: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    fontWeight: '800',
  },
  details: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    gap: spacing.md,
    paddingTop: spacing.md,
  },
  detailRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  detailText: {
    flex: 1,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.75,
  },
});
