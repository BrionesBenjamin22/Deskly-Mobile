import { StyleSheet, View } from 'react-native';

import { spacing } from '../../../theme/spacing';
import { Reservation } from '../types/reservation.types';
import { ReservationCard } from './ReservationCard';

type ReservationListProps = {
  reservations: Reservation[];
  onCancel?: (reservation: Reservation) => void;
};

export function ReservationList({ reservations, onCancel }: ReservationListProps) {
  return (
    <View style={styles.container}>
      {reservations.map((reservation) => (
        <ReservationCard
          key={reservation.id}
          reservation={reservation}
          onCancel={onCancel}
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
