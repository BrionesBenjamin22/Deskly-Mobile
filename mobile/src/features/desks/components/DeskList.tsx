import { StyleSheet, View } from 'react-native';

import { spacing } from '../../../theme/spacing';
import { Desk } from '../types/desk.types';
import { DeskCard } from './DeskCard';

export type DeskListProps = {
  desks: Desk[];
  selectedEndTime: string;
  selectedStartTime: string;
  onReserve: (desk: Desk) => void;
};

export function DeskList({
  desks,
  selectedEndTime,
  selectedStartTime,
  onReserve,
}: DeskListProps) {
  return (
    <View style={styles.container}>
      {desks.map((desk) => (
        <DeskCard
          key={desk.id}
          desk={desk}
          selectedEndTime={selectedEndTime}
          selectedStartTime={selectedStartTime}
          onReserve={onReserve}
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
