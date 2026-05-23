import { useMemo } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions } from 'react-native';

import { spacing } from '../../../theme/spacing';
import { DatePill } from './DatePill';

export type DeskDateOption = {
  id: string;
  weekday: string;
  day: string;
  month: string;
};

const weekdays = ['dom', 'lun', 'mar', 'mi\u00e9', 'jue', 'vie', 's\u00e1b'];
const months = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
];

function toDateId(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getVisibleDateCount(width: number) {
  if (width >= 1024) {
    return 10;
  }

  if (width >= 768) {
    return 8;
  }

  if (width >= 480) {
    return 6;
  }

  return 4;
}

export function getDeskDateOptions(baseDate = new Date(), count = 4): DeskDateOption[] {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(baseDate);
    date.setHours(0, 0, 0, 0);
    date.setDate(baseDate.getDate() + index);

    return {
      id: toDateId(date),
      weekday: weekdays[date.getDay()],
      day: String(date.getDate()),
      month: months[date.getMonth()],
    };
  });
}

export const deskDateOptions = getDeskDateOptions();

type DateSelectorProps = {
  selectedDate: string;
  onSelectDate: (date: string) => void;
};

export function DateSelector({ selectedDate, onSelectDate }: DateSelectorProps) {
  const { width } = useWindowDimensions();
  const visibleDateCount = getVisibleDateCount(width);
  const dates = useMemo(
    () => getDeskDateOptions(new Date(), visibleDateCount),
    [visibleDateCount],
  );

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {dates.map((date) => (
        <DatePill
          key={date.id}
          weekday={date.weekday}
          day={date.day}
          month={date.month}
          selected={selectedDate === date.id}
          onPress={() => onSelectDate(date.id)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  content: {
    gap: spacing.sm,
    paddingRight: spacing.screenX,
  },
});
