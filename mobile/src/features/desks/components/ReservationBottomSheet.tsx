import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../../../components/ui/AppText';
import { Button } from '../../../components/ui/Button';
import { Icon } from '../../../components/ui/Icon';
import { IconButton } from '../../../components/ui/IconButton';
import { Input } from '../../../components/ui/Input';
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
  onClose: () => void;
  onConfirm: (payload: {
    desk: Desk;
    date: string;
    startTime: string;
    endTime: string;
  }) => void;
};

type ReservationFormErrors = {
  startTime?: string;
  endTime?: string;
};

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(':').map(Number);

  return hours * 60 + minutes;
}

function validateReservationForm(startTime: string, endTime: string) {
  const errors: ReservationFormErrors = {};
  const normalizedStartTime = startTime.trim();
  const normalizedEndTime = endTime.trim();

  if (!normalizedStartTime) {
    errors.startTime = 'Ingrese el horario de inicio.';
  } else if (!TIME_PATTERN.test(normalizedStartTime)) {
    errors.startTime = 'Use el formato HH:mm, por ejemplo 09:00.';
  }

  if (!normalizedEndTime) {
    errors.endTime = 'Ingrese el horario de fin.';
  } else if (!TIME_PATTERN.test(normalizedEndTime)) {
    errors.endTime = 'Use el formato HH:mm, por ejemplo 18:00.';
  } else if (
    !errors.startTime &&
    timeToMinutes(normalizedEndTime) <= timeToMinutes(normalizedStartTime)
  ) {
    errors.endTime = 'El horario de fin debe ser posterior al inicio.';
  }

  return errors;
}

export function ReservationBottomSheet({
  visible,
  desk,
  selectedDate,
  selectedDateLabel,
  initialStartTime,
  initialEndTime,
  onClose,
  onConfirm,
}: ReservationBottomSheetProps) {
  const [startTime, setStartTime] = useState(initialStartTime);
  const [endTime, setEndTime] = useState(initialEndTime);
  const [fieldErrors, setFieldErrors] = useState<ReservationFormErrors>({});

  useEffect(() => {
    if (visible) {
      setStartTime(initialStartTime);
      setEndTime(initialEndTime);
      setFieldErrors({});
    }
  }, [initialEndTime, initialStartTime, visible]);

  const handleConfirm = () => {
    if (!desk) {
      return;
    }

    const nextErrors = validateReservationForm(startTime, endTime);
    setFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    onConfirm({
      desk,
      date: selectedDate,
      startTime: startTime.trim(),
      endTime: endTime.trim(),
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

          <View style={styles.inputsRow}>
            <View style={styles.inputGroup}>
              <Input
                label="Hora inicio"
                value={startTime}
                onChangeText={(value) => {
                  setStartTime(value);
                  setFieldErrors((current) => ({
                    ...current,
                    startTime: undefined,
                  }));
                }}
                placeholder="09:00"
                style={fieldErrors.startTime ? styles.inputError : undefined}
              />
              {fieldErrors.startTime ? (
                <AppText variant="caption" color={statusColors.error} style={styles.errorText}>
                  {fieldErrors.startTime}
                </AppText>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <Input
                label="Hora fin"
                value={endTime}
                onChangeText={(value) => {
                  setEndTime(value);
                  setFieldErrors((current) => ({
                    ...current,
                    endTime: undefined,
                  }));
                }}
                placeholder="18:00"
                style={fieldErrors.endTime ? styles.inputError : undefined}
              />
              {fieldErrors.endTime ? (
                <AppText variant="caption" color={statusColors.error} style={styles.errorText}>
                  {fieldErrors.endTime}
                </AppText>
              ) : null}
            </View>
          </View>

          <Button title="Confirmar Reserva" onPress={handleConfirm}>
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
  inputsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  inputGroup: {
    flex: 1,
    gap: spacing.xs,
  },
  inputError: {
    borderColor: statusColors.error,
  },
  errorText: {
    fontWeight: '700',
  },
});
