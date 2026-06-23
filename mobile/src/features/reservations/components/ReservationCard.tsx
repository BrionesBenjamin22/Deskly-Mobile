import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../../../components/ui/AppText';
import { Card } from '../../../components/ui/Card';
import { Icon } from '../../../components/ui/Icon';
import { colors, statusColors } from '../../../theme/colors';
import { radii, spacing } from '../../../theme/spacing';
import { Reservation } from '../types/reservation.types';
import { ReservationStatusBadge } from './ReservationStatusBadge';

type ReservationCardProps = {
  reservation: Reservation;
  onCancel?: (reservation: Reservation) => void;
  onValidateArrival?: (reservation: Reservation) => void;
  managerView?: boolean;
};

export function ReservationCard({
  reservation,
  onCancel,
  onValidateArrival,
  managerView = false,
}: ReservationCardProps) {
  const isCurrent = ['pending', 'reserved', 'active'].includes(
    reservation.status,
  );
  const isMuted = !isCurrent;
  const isCheckedIn = Boolean(reservation.checkedInAt);
  const canCancel = managerView
    ? reservation.status === 'reserved'
    : ['pending', 'reserved'].includes(reservation.status);

  return (
    <Card style={[styles.card, isMuted && styles.mutedCard]}>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <AppText
            variant="subtitle"
            color={isMuted ? colors.primaryLight : colors.primary}
            style={styles.title}
          >
            {reservation.deskName}
          </AppText>
          <View style={styles.metaRow}>
            <Icon name="mapPin" size={16} color={colors.primaryLight} />
            <AppText variant="caption" color={colors.blackOverlay}>
              Código {reservation.deskCode}
            </AppText>
          </View>
        </View>
        <ReservationStatusBadge status={reservation.status} />
      </View>

      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <Icon name="calendar" size={16} color={colors.primaryLight} />
          <AppText variant="caption" color={colors.primary} style={styles.detailText}>
            {reservation.dateLabel}
          </AppText>
        </View>

        <View style={styles.detailItem}>
          <Icon name="clock" size={16} color={colors.primaryLight} />
          <AppText variant="caption" color={colors.primary} style={styles.detailText}>
            {reservation.startTime} - {reservation.endTime}
          </AppText>
        </View>
      </View>

      {managerView && reservation.memberFullName ? (
        <View style={styles.memberRow}>
          <AppText variant="caption" color={colors.primaryLight}>Miembro</AppText>
          <AppText variant="body" color={colors.primary} style={styles.memberName}>
            {reservation.memberFullName}
          </AppText>
        </View>
      ) : null}

      {managerView && reservation.status === 'active' && isCheckedIn ? (
        <View style={styles.checkedInBanner}>
          <Icon name="circleCheck" size={16} color={statusColors.success} />
          <AppText variant="caption" color={statusColors.success} style={styles.checkedInText}>
            Llegada validada
          </AppText>
        </View>
      ) : canCancel ? (
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            onPress={() => onCancel?.(reservation)}
            style={({ pressed }) => [
              styles.cancelButton,
              pressed && styles.cancelButtonPressed,
            ]}
          >
            <AppText variant="caption" color={statusColors.error} style={styles.cancelText}>
              Cancelar Reserva
            </AppText>
          </Pressable>
          {managerView ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => onValidateArrival?.(reservation)}
              style={({ pressed }) => [styles.arrivalButton, pressed && styles.cancelButtonPressed]}
            >
              <AppText variant="caption" color={colors.white} style={styles.cancelText}>
                Validar Llegada
              </AppText>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    gap: spacing.lg,
    padding: spacing.xl,
  },
  mutedCard: {
    opacity: 0.85,
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
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  detailItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  detailText: {
    fontWeight: '700',
  },
  cancelButton: {
    alignSelf: 'center',
    borderColor: statusColors.error,
    borderRadius: radii.md,
    borderWidth: 1,
    minHeight: 40,
    minWidth: 180,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonPressed: {
    backgroundColor: statusColors.errorSoft,
  },
  cancelText: {
    fontWeight: '800',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  arrivalButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    justifyContent: 'center',
    minHeight: 40,
    minWidth: 180,
    paddingHorizontal: spacing.lg,
  },
  memberRow: {
    backgroundColor: colors.background,
    borderRadius: radii.md,
    gap: spacing.xs,
    padding: spacing.md,
  },
  memberName: { fontWeight: '800' },
  checkedInBanner: {
    alignItems: 'center',
    backgroundColor: statusColors.successSoft,
    borderRadius: radii.md,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: 40,
  },
  checkedInText: { fontWeight: '800' },
});
