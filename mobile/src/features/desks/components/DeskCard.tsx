import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../../../components/ui/AppText';
import { Card } from '../../../components/ui/Card';
import { Icon } from '../../../components/ui/Icon';
import { colors } from '../../../theme/colors';
import { radii, spacing } from '../../../theme/spacing';
import { Desk, DeskStatus } from '../types/desk.types';
import { DeskAmenities } from './DeskAmenities';

export type DeskCardProps = {
  desk: Desk;
  onReserve: (desk: Desk) => void;
};

function getDeskTitle(desk: Desk) {
  return desk.name ?? `Escritorio ${desk.code}`;
}

function getLocationText(desk: Desk) {
  const zone = desk.zone ? `Zona ${desk.zone}` : 'Zona sin asignar';
  const location = desk.description?.description ?? desk.description?.name;

  return location ? `${zone} - ${location}` : zone;
}

const statusLabels: Record<DeskStatus, string> = {
  available: 'Disponible',
  unavailable: 'No disponible',
  reserved: 'Reservado',
};

export function DeskCard({ desk, onReserve }: DeskCardProps) {
  const capacity = desk.description?.peopleCapacity;
  const isAvailable = desk.enabled && desk.status === 'available';

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <AppText variant="subtitle" style={styles.title}>
            {getDeskTitle(desk)}
          </AppText>
          <AppText variant="caption" color={colors.blackOverlay}>
            {getLocationText(desk)}
          </AppText>
        </View>

        <View style={styles.capacity}>
          <Icon name="users" size={17} color={colors.primaryLight} />
          <AppText variant="caption" color={colors.primary} style={styles.capacityText}>
            {capacity ?? '-'}
          </AppText>
        </View>
      </View>

      <DeskAmenities amenities={desk.amenities} />

      <View style={styles.footer}>
        <AppText
          variant="caption"
          color={isAvailable ? colors.accent : colors.blackOverlay}
          style={styles.status}
        >
          {desk.enabled ? statusLabels[desk.status] : 'No disponible'}
        </AppText>
        <Pressable
          accessibilityRole="button"
          disabled={!isAvailable}
          onPress={() => onReserve(desk)}
          style={({ pressed }) => [
            styles.reserveAction,
            !isAvailable && styles.disabledAction,
            pressed && isAvailable && styles.pressedAction,
          ]}
        >
          <AppText variant="caption" color={colors.primary} style={styles.reserveText}>
            Reservar
          </AppText>
          <Icon name="chevronRight" size={20} color={colors.primary} />
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    gap: spacing.lg,
    padding: spacing.xl,
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
    fontWeight: '700',
  },
  capacity: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 32,
    paddingHorizontal: spacing.sm,
  },
  capacityText: {
    fontWeight: '800',
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  status: {
    fontWeight: '700',
  },
  reserveAction: {
    alignItems: 'center',
    borderRadius: radii.md,
    flexDirection: 'row',
    minHeight: 40,
    paddingHorizontal: spacing.sm,
  },
  reserveText: {
    fontWeight: '800',
  },
  disabledAction: {
    opacity: 0.35,
  },
  pressedAction: {
    backgroundColor: colors.background,
  },
});
