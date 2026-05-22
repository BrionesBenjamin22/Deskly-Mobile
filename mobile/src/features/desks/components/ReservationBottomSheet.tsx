import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../../../components/ui/AppText';
import { Button } from '../../../components/ui/Button';
import { Icon } from '../../../components/ui/Icon';
import { IconButton } from '../../../components/ui/IconButton';
import { Input } from '../../../components/ui/Input';
import { colors } from '../../../theme/colors';
import { radii, spacing } from '../../../theme/spacing';
import { Desk } from '../types/desk.types';
import { DeskSummaryCard } from './DeskSummaryCard';

type ReservationBottomSheetProps = {
  visible: boolean;
  desk?: Desk | null;
  selectedDateLabel?: string;
  onClose: () => void;
  onConfirm: (payload: {
    desk: Desk;
    dateLabel: string;
    startTime: string;
    endTime: string;
  }) => void;
};

export function ReservationBottomSheet({
  visible,
  desk,
  selectedDateLabel = 'jueves 7 de mayo',
  onClose,
  onConfirm,
}: ReservationBottomSheetProps) {
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');

  useEffect(() => {
    if (visible) {
      setStartTime('09:00');
      setEndTime('18:00');
    }
  }, [visible]);

  const handleConfirm = () => {
    if (!desk) {
      return;
    }

    onConfirm({
      desk,
      dateLabel: selectedDateLabel,
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

          <View style={styles.inputsRow}>
            <Input
              label="Hora inicio"
              value={startTime}
              onChangeText={setStartTime}
              placeholder="09:00"
            />
            <Input
              label="Hora fin"
              value={endTime}
              onChangeText={setEndTime}
              placeholder="18:00"
            />
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
});
