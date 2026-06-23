import { StyleSheet, View } from 'react-native';

import { spacing } from '../../../theme/spacing';
import { Reservation } from '../types/reservation.types';
import { ReservationCard } from './ReservationCard';

type ReservationListProps = {
  reservations: Reservation[];
  onCancel?: (reservation: Reservation) => void;
  onValidateArrival?: (reservation: Reservation) => void;
  managerView?: boolean;
};

export function ReservationList({
  reservations,
  onCancel,
  onValidateArrival,
  managerView = false,
}: ReservationListProps) {
  return (
    <View style={styles.container}>
      {reservations.map((reservation) => (
        <ReservationCard
          key={reservation.id}
          reservation={reservation}
          onCancel={onCancel}
          onValidateArrival={onValidateArrival}
          managerView={managerView}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
});
