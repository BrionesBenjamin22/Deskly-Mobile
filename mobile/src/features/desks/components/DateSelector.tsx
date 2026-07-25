import { useEffect, useMemo, useRef } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

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

const DATE_OPTION_COUNT = 30;
const DATE_PILL_WIDTH = 84;
const DATE_PILL_STEP = DATE_PILL_WIDTH + spacing.sm;
const WEEK_SNAP_DISTANCE = DATE_PILL_STEP * 7;

export function getDeskDateOptions(
  baseDate = new Date(),
  count = 4,
): DeskDateOption[] {
  const normalizedBase = new Date(baseDate);
  normalizedBase.setHours(0, 0, 0, 0);

  return Array.from({ length: count }, (_, index) => {
    const date = new Date(normalizedBase);
    date.setDate(normalizedBase.getDate() + index);

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

export function DateSelector({
  selectedDate,
  onSelectDate,
}: DateSelectorProps) {
  const scrollRef = useRef<ScrollView>(null);
  const dates = useMemo(
    () => getDeskDateOptions(new Date(), DATE_OPTION_COUNT),
    [],
  );

  useEffect(() => {
    const selectedIndex = dates.findIndex((date) => date.id === selectedDate);

    if (selectedIndex < 0) {
      return;
    }

    scrollRef.current?.scrollTo({
      animated: true,
      x: selectedIndex * DATE_PILL_STEP,
      y: 0,
    });
  }, [dates, selectedDate]);

  return (
    <ScrollView
      ref={scrollRef}
      decelerationRate="fast"
      horizontal
      showsHorizontalScrollIndicator={false}
      snapToInterval={WEEK_SNAP_DISTANCE}
      snapToAlignment="start"
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
