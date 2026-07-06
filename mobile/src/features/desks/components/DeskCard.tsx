import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../../../components/ui/AppText';
import { Card } from '../../../components/ui/Card';
import { Icon } from '../../../components/ui/Icon';
import { colors, statusColors } from '../../../theme/colors';
import { radii, spacing } from '../../../theme/spacing';
import { Desk, DeskStatus } from '../types/desk.types';
import { DeskAmenities } from './DeskAmenities';

export type DeskCardProps = {
  desk: Desk;
  selectedEndTime: string;
  selectedStartTime: string;
  onReserve: (desk: Desk) => void;
};

function getDeskTitle(desk: Desk) {
  return desk.name ?? `Escritorio ${desk.code}`;
}

function getLocationText(desk: Desk) {
  const zone = desk.zone ? `Zona ${desk.zone}` : 'Zona sin asignar';
  const area = desk.area?.name;
  const locality = desk.area?.locality?.name;
  const location = [locality, area].filter(Boolean).join(' - ');

  return location ? `${zone} - ${location}` : zone;
}

const statusLabels: Record<DeskStatus, string> = {
  available: 'Disponible',
  unavailable: 'No disponible',
  reserved: 'Reservado',
};

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(':').map(Number);

  return hours * 60 + minutes;
}

function getReservationNotice(
  desk: Desk,
  selectedStartTime: string,
  selectedEndTime: string,
) {
  const reservedSlots = desk.reservedSlots ?? [];
  const overlappingSlot = reservedSlots.find(
    (reservedSlot) =>
      timeToMinutes(selectedStartTime) < timeToMinutes(reservedSlot.endTime) &&
      timeToMinutes(selectedEndTime) > timeToMinutes(reservedSlot.startTime),
  );

  if (overlappingSlot) {
    return {
      tone: 'blocked' as const,
      text: `Reservado de ${overlappingSlot.startTime} a ${overlappingSlot.endTime}`,
    };
  }

  const nextSlot = reservedSlots.find(
    (reservedSlot) =>
      timeToMinutes(reservedSlot.startTime) >= timeToMinutes(selectedStartTime),
  );

  if (!nextSlot) {
    return null;
  }

  return {
    tone: 'upcoming' as const,
    text: `Proxima reserva de ${nextSlot.startTime} a ${nextSlot.endTime}`,
  };
}

export function DeskCard({
  desk,
  selectedEndTime,
  selectedStartTime,
  onReserve,
}: DeskCardProps) {
  const canOpenReservation = desk.enabled;
  const reservationNotice = getReservationNotice(
    desk,
    selectedStartTime,
    selectedEndTime,
  );

  return (
    <Card style={styles.card}>
      {reservationNotice ? (
        <View
          style={[
            styles.reservedBanner,
            reservationNotice.tone === 'upcoming' && styles.upcomingBanner,
          ]}
        >
          <Icon
            name={reservationNotice.tone === 'blocked' ? 'circleAlert' : 'clock'}
            size={16}
            color={
              reservationNotice.tone === 'blocked'
                ? statusColors.error
                : colors.primaryLight
            }
          />
          <AppText
            variant="caption"
            color={
              reservationNotice.tone === 'blocked'
                ? statusColors.error
                : colors.primaryLight
            }
            style={styles.reservedText}
          >
            {reservationNotice.text}
          </AppText>
        </View>
      ) : null}

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
            {desk.peopleCapacity}
          </AppText>
        </View>
      </View>

      <DeskAmenities amenities={desk.amenities} />

      <View style={styles.footer}>
        <AppText
          variant="caption"
          color={desk.status === 'available' ? colors.accent : colors.blackOverlay}
          style={styles.status}
        >
          {desk.enabled ? statusLabels[desk.status] : 'No disponible'}
        </AppText>
        <Pressable
          accessibilityRole="button"
          disabled={!canOpenReservation}
          onPress={() => onReserve(desk)}
          style={({ pressed }) => [
            styles.reserveAction,
            !canOpenReservation && styles.disabledAction,
            pressed && canOpenReservation && styles.pressedAction,
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
  reservedBanner: {
    alignItems: 'center',
    backgroundColor: statusColors.errorSoft,
    borderColor: statusColors.error,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  reservedText: {
    flex: 1,
    fontWeight: '800',
  },
  upcomingBanner: {
    backgroundColor: colors.background,
    borderColor: colors.border,
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
