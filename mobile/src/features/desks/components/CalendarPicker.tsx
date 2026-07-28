import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '../../../components/ui/AppText';
import { Button } from '../../../components/ui/Button';
import { Icon } from '../../../components/ui/Icon';
import { IconButton } from '../../../components/ui/IconButton';
import { colors } from '../../../theme/colors';
import { radii, spacing } from '../../../theme/spacing';

type CalendarPickerProps = {
  visible: boolean;
  onSelectDate: (dateId: string) => void;
  onClose: () => void;
};

function toDateId(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export function CalendarPicker({ visible, onSelectDate, onClose }: CalendarPickerProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 29);

  const [displayDate, setDisplayDate] = useState(() => new Date(today));

  const weekdays = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

  const year = displayDate.getFullYear();
  const month = displayDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const monthLabel = new Intl.DateTimeFormat('es-AR', {
    month: 'long',
    year: 'numeric',
  }).format(displayDate);

  // Crear array de días para mostrar (incluyendo espacios vacíos)
  const calendarDays: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  // Rellenar la última fila para que siempre tenga 7 elementos
  while (calendarDays.length % 7 !== 0) {
    calendarDays.push(null);
  }

  // Agrupar en semanas
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

  const handlePreviousMonth = () => {
    setDisplayDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };

  const handleNextMonth = () => {
    setDisplayDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };

  const handleSelectDate = (day: number) => {
    const selectedDate = new Date(year, month, day);
    selectedDate.setHours(0, 0, 0, 0);
    onSelectDate(toDateId(selectedDate));
    onClose();
  };

  const isDateSelectable = (day: number): boolean => {
    const date = new Date(year, month, day);
    date.setHours(0, 0, 0, 0);
    return date >= today && date <= maxDate;
  };

  const canGoToPrevious = new Date(year, month, 1) > today;
  const canGoToNext = new Date(year, month + 1, 1) <= maxDate;

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable
          accessibilityRole="button"
          style={styles.backdrop}
          onPress={onClose}
        />

        <View style={styles.sheet}>
          <View style={styles.header}>
            <AppText variant="subtitle" style={styles.title}>
              Seleccionar fecha
            </AppText>
            <IconButton
              accessibilityLabel="Cerrar calendario"
              icon="x"
              onPress={onClose}
            />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Navegación de meses */}
            <View style={styles.monthNavigation}>
              <Pressable
                disabled={!canGoToPrevious}
                onPress={handlePreviousMonth}
                style={({ pressed }) => [
                  styles.navButton,
                  !canGoToPrevious && styles.navButtonDisabled,
                  pressed && styles.navButtonPressed,
                ]}
              >
                <View style={styles.rotatedChevron}>
                  <Icon
                    name="chevronRight"
                    size={20}
                    color={canGoToPrevious ? colors.primary : colors.primaryLight}
                  />
                </View>
              </Pressable>

              <AppText variant="body" style={styles.monthTitle}>
                {monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}
              </AppText>

              <Pressable
                disabled={!canGoToNext}
                onPress={handleNextMonth}
                style={({ pressed }) => [
                  styles.navButton,
                  !canGoToNext && styles.navButtonDisabled,
                  pressed && styles.navButtonPressed,
                ]}
              >
                <Icon
                  name="chevronRight"
                  size={20}
                  color={canGoToNext ? colors.primary : colors.primaryLight}
                />
              </Pressable>
            </View>

            <AppText variant="caption" color={colors.primaryLight} style={styles.subtitle}>
              Próximos 30 días desde hoy
            </AppText>

            {/* Encabezado de días de semana */}
            <View style={styles.weekdaysRow}>
              {weekdays.map((day) => (
                <AppText
                  key={day}
                  variant="caption"
                  color={colors.primaryLight}
                  style={styles.weekdayCell}
                >
                  {day}
                </AppText>
              ))}
            </View>

            {/* Grid de días */}
            {weeks.map((week, weekIndex) => (
              <View key={`week-${weekIndex}`} style={styles.weekRow}>
                {week.map((day, dayIndex) => {
                  if (day === null) {
                    return <View key={`empty-${dayIndex}`} style={styles.emptyDayCell} />;
                  }

                  const isSelectable = isDateSelectable(day);
                  const date = new Date(year, month, day);
                  date.setHours(0, 0, 0, 0);
                  const isToday = toDateId(date) === toDateId(today);

                  return (
                    <Pressable
                      key={`day-${day}`}
                      disabled={!isSelectable}
                      onPress={() => handleSelectDate(day)}
                      style={({ pressed }) => [
                        styles.dayCell,
                        isToday && styles.dayCellToday,
                        !isSelectable && styles.dayCellDisabled,
                        pressed && isSelectable && styles.dayCellPressed,
                      ]}
                    >
                      <AppText
                        variant="caption"
                        color={
                          !isSelectable
                            ? colors.primaryLight
                            : isToday
                            ? colors.white
                            : colors.primary
                        }
                        style={styles.dayText}
                      >
                        {day}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
            ))}

            <View style={styles.infoBox}>
              <Icon name="calendar" size={18} color={colors.primaryLight} />
              <AppText variant="caption" color={colors.primaryLight} style={styles.infoText}>
                Podés reservar en los próximos 30 días
              </AppText>
            </View>
          </ScrollView>

          <Button title="Cerrar" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.blackOverlay,
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: spacing.xxl,
    paddingTop: spacing.md,
  },
  scrollContent: {
    gap: spacing.lg,
    paddingHorizontal: spacing.screenX,
    paddingBottom: spacing.md,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenX,
    paddingBottom: spacing.md,
  },
  title: {
    fontWeight: '800',
  },
  monthNavigation: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  navButton: {
    borderRadius: radii.lg,
    padding: spacing.sm,
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
  navButtonPressed: {
    backgroundColor: colors.background,
  },
  rotatedChevron: {
    transform: [{ rotate: '180deg' }],
  },
  monthTitle: {
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  subtitle: {
    fontWeight: '600',
  },
  weekdaysRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  weekdayCell: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '700',
  },
  weekRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  emptyDayCell: {
    flex: 1,
    aspectRatio: 1,
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCellToday: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayCellDisabled: {
    opacity: 0.3,
  },
  dayCellPressed: {
    backgroundColor: colors.softMint,
    borderColor: colors.primary,
  },
  dayText: {
    fontWeight: '700',
    textAlign: 'center',
  },
  infoBox: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  infoText: {
    flex: 1,
    fontWeight: '600',
  },
});
