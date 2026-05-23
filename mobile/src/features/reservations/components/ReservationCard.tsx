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
};

export function ReservationCard({ reservation, onCancel }: ReservationCardProps) {
  const isActive = reservation.status === 'active';
  const isMuted = reservation.status !== 'active';

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

      {isActive ? (
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
});
