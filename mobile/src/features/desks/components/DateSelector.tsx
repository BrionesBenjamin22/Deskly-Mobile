import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { spacing } from '../../../theme/spacing';
import { DatePill } from './DatePill';

const dates = [
  { id: '2026-05-04', weekday: 'lun', day: '4', month: 'may' },
  { id: '2026-05-05', weekday: 'mar', day: '5', month: 'may' },
  { id: '2026-05-06', weekday: 'mie', day: '6', month: 'may' },
  { id: '2026-05-07', weekday: 'jue', day: '7', month: 'may' },
  { id: '2026-05-08', weekday: 'vie', day: '8', month: 'may' },
];

export function DateSelector() {
  const [selectedDate, setSelectedDate] = useState(dates[0].id);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      {dates.map((date) => (
        <DatePill
          key={date.id}
          weekday={date.weekday}
          day={date.day}
          month={date.month}
          selected={selectedDate === date.id}
          onPress={() => setSelectedDate(date.id)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.sm,
    paddingRight: spacing.screenX,
  },
});
