import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '../../../components/ui/AppText';
import { Button } from '../../../components/ui/Button';
import { Icon } from '../../../components/ui/Icon';
import { IconButton } from '../../../components/ui/IconButton';
import { colors, statusColors } from '../../../theme/colors';
import { radii, spacing } from '../../../theme/spacing';
import { Desk } from '../types/desk.types';
import { DeskSummaryCard } from './DeskSummaryCard';

type ReservationBottomSheetProps = {
  visible: boolean;
  desk?: Desk | null;
  selectedDate: string;
  selectedDateLabel: string;
  initialStartTime: string;
  initialEndTime: string;
  timeOptions: string[];
  onClose: () => void;
  onConfirm: (payload: {
    desk: Desk;
    date: string;
    startTime: string;
    endTime: string;
  }) => void;
};

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

function overlapsReservedSlot(
  startTime: string,
  endTime: string,
  reservedSlots: NonNullable<Desk['reservedSlots']>,
) {
  return reservedSlots.some(
    (slot) =>
      timeToMinutes(startTime) < timeToMinutes(slot.endTime) &&
      timeToMinutes(endTime) > timeToMinutes(slot.startTime),
  );
}

function getEndOptions(
  startTime: string,
  timeOptions: string[],
  reservedSlots: NonNullable<Desk['reservedSlots']>,
) {
  return timeOptions.filter(
    (endTime) =>
      timeToMinutes(endTime) > timeToMinutes(startTime) &&
      !overlapsReservedSlot(startTime, endTime, reservedSlots),
  );
}

function getStartOptions(
  timeOptions: string[],
  reservedSlots: NonNullable<Desk['reservedSlots']>,
) {
  return timeOptions.filter(
    (startTime) => getEndOptions(startTime, timeOptions, reservedSlots).length > 0,
  );
}

export function ReservationBottomSheet({
  visible,
  desk,
  selectedDate,
  selectedDateLabel,
  initialStartTime,
  initialEndTime,
  timeOptions,
  onClose,
  onConfirm,
}: ReservationBottomSheetProps) {
  const [startTime, setStartTime] = useState(initialStartTime);
  const [endTime, setEndTime] = useState(initialEndTime);
  const reservedSlots = useMemo(() => desk?.reservedSlots ?? [], [desk]);
  const startOptions = useMemo(
    () => getStartOptions(timeOptions, reservedSlots),
    [reservedSlots, timeOptions],
  );
  const endOptions = useMemo(
    () => (startTime ? getEndOptions(startTime, timeOptions, reservedSlots) : []),
    [reservedSlots, startTime, timeOptions],
  );

  useEffect(() => {
    if (!visible) return;
    const nextStart = startOptions.includes(initialStartTime)
      ? initialStartTime
      : startOptions[0] ?? '';
    const validEnds = nextStart
      ? getEndOptions(nextStart, timeOptions, reservedSlots)
      : [];
    setStartTime(nextStart);
    setEndTime(
      validEnds.includes(initialEndTime) ? initialEndTime : validEnds[0] ?? '',
    );
  }, [
    initialEndTime,
    initialStartTime,
    reservedSlots,
    startOptions,
    timeOptions,
    visible,
  ]);

  const changeStart = (value: string) => {
    const validEnds = getEndOptions(value, timeOptions, reservedSlots);
    setStartTime(value);
    setEndTime(validEnds[0] ?? '');
  };
  const noAvailability = startOptions.length === 0;
  const canConfirm = Boolean(desk && startTime && endTime && !noAvailability);

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cerrar confirmacion de reserva"
          style={styles.backdrop}
          onPress={onClose}
        />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.header}>
              <AppText variant="subtitle" style={styles.title}>
                Confirmar reserva
              </AppText>
              <IconButton
                accessibilityLabel="Cerrar confirmacion de reserva"
                icon="x"
                onPress={onClose}
              />
            </View>
            {desk ? <DeskSummaryCard desk={desk} /> : null}
            <View style={styles.dateBlock}>
              <Icon name="calendar" size={18} color={colors.primaryLight} />
              <View>
                <AppText variant="caption" color={colors.blackOverlay}>
                  Fecha seleccionada
                </AppText>
                <AppText variant="body" style={styles.strong}>
                  {selectedDateLabel}
                </AppText>
              </View>
            </View>
            <TimeOptions
              label="Hora inicio"
              options={startOptions}
              selected={startTime}
              onSelect={changeStart}
            />
            <TimeOptions
              label="Hora fin"
              options={endOptions}
              selected={endTime}
              onSelect={setEndTime}
            />
            {noAvailability ? (
              <AppText variant="caption" color={statusColors.error}>
                No hay horarios disponibles. Seleccione otra fecha.
              </AppText>
            ) : null}
            <AppText variant="caption" color={colors.primaryLight}>
              Luego de reservar podra elegir seña o pago total con una cotizacion
              calculada por Deskly.
            </AppText>
          </ScrollView>
          <Button
            title="Reservar y continuar al pago"
            disabled={!canConfirm}
            onPress={() => {
              if (!desk || !canConfirm) return;
              onConfirm({ desk, date: selectedDate, startTime, endTime });
            }}
          >
            <Icon name="chevronRight" size={18} color={colors.white} />
          </Button>
        </View>
      </View>
    </Modal>
  );
}

function TimeOptions({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <View style={styles.optionGroup}>
      <AppText variant="caption" color={colors.blackOverlay} style={styles.strong}>
        {label}
      </AppText>
      <View style={styles.optionList}>
        {options.map((option) => (
          <Pressable
            key={option}
            accessibilityRole="button"
            accessibilityState={{ selected: option === selected }}
            onPress={() => onSelect(option)}
            style={[
              styles.timeOption,
              option === selected && styles.timeOptionSelected,
            ]}
          >
            <AppText
              variant="caption"
              color={option === selected ? colors.white : colors.primary}
              style={styles.strong}
            >
              {option}
            </AppText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.blackOverlay },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
    paddingBottom: spacing.xxl,
    paddingTop: spacing.md,
  },
  handle: {
    alignSelf: 'center',
    backgroundColor: colors.border,
    borderRadius: radii.pill,
    height: 4,
    marginBottom: spacing.sm,
    width: 42,
  },
  scrollContent: {
    gap: spacing.lg,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.screenX,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: { fontWeight: '800' },
  strong: { fontWeight: '700' },
  dateBlock: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  optionGroup: { gap: spacing.sm },
  optionList: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  timeOption: {
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 34,
    paddingHorizontal: spacing.md,
  },
  timeOptionSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
});
