import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

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
    (reservedSlot) =>
      timeToMinutes(startTime) < timeToMinutes(reservedSlot.endTime) &&
      timeToMinutes(endTime) > timeToMinutes(reservedSlot.startTime),
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
  return timeOptions.filter((startTime) =>
    getEndOptions(startTime, timeOptions, reservedSlots).length > 0,
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
  const reservedSlots = useMemo(() => desk?.reservedSlots ?? [], [desk?.reservedSlots]);
  const startOptions = useMemo(
    () => getStartOptions(timeOptions, reservedSlots),
    [reservedSlots, timeOptions],
  );
  const endOptions = useMemo(
    () =>
      startTime ? getEndOptions(startTime, timeOptions, reservedSlots) : [],
    [reservedSlots, startTime, timeOptions],
  );

  useEffect(() => {
    if (visible) {
      const nextStartTime = startOptions.includes(initialStartTime)
        ? initialStartTime
        : startOptions[0] ?? '';
      const nextEndOptions = nextStartTime
        ? getEndOptions(nextStartTime, timeOptions, reservedSlots)
        : [];
      const nextEndTime = nextEndOptions.includes(initialEndTime)
        ? initialEndTime
        : nextEndOptions[0] ?? '';

      setStartTime(nextStartTime);
      setEndTime(nextEndTime);
    }
  }, [
    initialEndTime,
    initialStartTime,
    reservedSlots,
    startOptions,
    timeOptions,
    visible,
  ]);

  const handleConfirm = () => {
    if (!desk) {
      return;
    }

    if (!startTime || !endTime) {
      return;
    }

    onConfirm({
      desk,
      date: selectedDate,
      startTime,
      endTime,
    });
  };

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

          <View style={styles.header}>
            <AppText variant="subtitle" style={styles.title}>
              Confirmar Reserva
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
              <AppText variant="caption" color={colors.blackOverlay} style={styles.label}>
                Fecha seleccionada
              </AppText>
              <AppText variant="body" style={styles.dateText}>
                {selectedDateLabel}
              </AppText>
            </View>
          </View>

          <View style={styles.optionGroup}>
            <AppText variant="caption" color={colors.blackOverlay} style={styles.label}>
              Hora inicio
            </AppText>
            <View style={styles.optionList}>
              {startOptions.map((option) => (
                <Pressable
                  key={option}
                  accessibilityRole="button"
                  onPress={() => {
                    const nextEndOptions = getEndOptions(
                      option,
                      timeOptions,
                      reservedSlots,
                    );
                    setStartTime(option);
                    setEndTime(nextEndOptions[0] ?? '');
                  }}
                  style={[
                    styles.timeOption,
                    startTime === option && styles.timeOptionSelected,
                  ]}
                >
                  <AppText
                    variant="caption"
                    color={startTime === option ? colors.white : colors.primary}
                    style={styles.timeOptionText}
                  >
                    {option}
                  </AppText>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.optionGroup}>
            <AppText variant="caption" color={colors.blackOverlay} style={styles.label}>
              Hora fin
            </AppText>
            <View style={styles.optionList}>
              {endOptions.map((option) => (
                <Pressable
                  key={option}
                  accessibilityRole="button"
                  onPress={() => setEndTime(option)}
                  style={[
                    styles.timeOption,
                    endTime === option && styles.timeOptionSelected,
                  ]}
                >
                  <AppText
                    variant="caption"
                    color={endTime === option ? colors.white : colors.primary}
                    style={styles.timeOptionText}
                  >
                    {option}
                  </AppText>
                </Pressable>
              ))}
            </View>
          </View>

          {startOptions.length === 0 ? (
            <AppText variant="caption" color={statusColors.error} style={styles.errorText}>
              No hay horarios disponibles para este escritorio en la fecha seleccionada.
            </AppText>
          ) : null}

          <Button
            title="Confirmar Reserva"
            disabled={!startTime || !endTime}
            onPress={handleConfirm}
          >
            <Icon name="chevronRight" size={18} color={colors.white} />
          </Button>
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
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.screenX,
    paddingTop: spacing.md,
  },
  handle: {
    alignSelf: 'center',
    backgroundColor: colors.border,
    borderRadius: radii.pill,
    height: 4,
    width: 42,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    fontWeight: '800',
  },
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
  label: {
    fontWeight: '700',
  },
  dateText: {
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  optionGroup: {
    gap: spacing.sm,
  },
  optionList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  timeOption: {
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    minHeight: 34,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  timeOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  timeOptionText: {
    fontWeight: '800',
  },
  errorText: {
    fontWeight: '700',
  },
});
