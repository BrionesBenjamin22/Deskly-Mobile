import { useEffect, useMemo, useState } from 'react';
import {
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { AppText } from '../../../components/ui/AppText';
import { Button } from '../../../components/ui/Button';
import { Icon } from '../../../components/ui/Icon';
import { IconButton } from '../../../components/ui/IconButton';
import { colors, statusColors } from '../../../theme/colors';
import { radii, spacing } from '../../../theme/spacing';
import { Desk } from '../types/desk.types';
import { DeskSummaryCard } from './DeskSummaryCard';

const PRICE_PER_HOUR = 1500;

type PaymentOption = 'senia' | 'total' | 'personalizado';

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
    amount: number;
  }) => void;
};

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

function calcularMontos(startTime: string, endTime: string) {
  const diffMinutes = timeToMinutes(endTime) - timeToMinutes(startTime);
  const hours = Math.max(0, diffMinutes / 60);
  const montoTotal = Math.round(hours * PRICE_PER_HOUR);
  const montoSenia = Math.round(montoTotal * 0.3);
  return { montoTotal, montoSenia };
}

function formatMoneda(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
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

type PaymentOptionRowProps = {
  label: string;
  sublabel: string;
  amount: number | null;
  selected: boolean;
  onPress: () => void;
  children?: React.ReactNode;
};

function PaymentOptionRow({ label, sublabel, amount, selected, onPress, children }: PaymentOptionRowProps) {
  return (
    <Pressable
      accessibilityRole="radio"
      onPress={onPress}
      style={[styles.paymentOption, selected && styles.paymentOptionSelected]}
    >
      <View style={styles.paymentOptionMain}>
        <View style={[styles.radio, selected && styles.radioSelected]}>
          {selected ? <View style={styles.radioDot} /> : null}
        </View>
        <View style={styles.paymentOptionText}>
          <AppText variant="caption" style={styles.paymentOptionLabel}>
            {label}
          </AppText>
          <AppText variant="caption" color={colors.primaryLight}>
            {sublabel}
          </AppText>
        </View>
        {amount !== null ? (
          <AppText variant="caption" style={styles.paymentOptionAmount}>
            {formatMoneda(amount)}
          </AppText>
        ) : null}
      </View>
      {children}
    </Pressable>
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
  const [showPayment, setShowPayment] = useState(false);
  const [tipoPago, setTipoPago] = useState<PaymentOption>('senia');
  const [montoPersonalizado, setMontoPersonalizado] = useState('');

  const reservedSlots = useMemo(() => desk?.reservedSlots ?? [], [desk?.reservedSlots]);
  const startOptions = useMemo(
    () => getStartOptions(timeOptions, reservedSlots),
    [reservedSlots, timeOptions],
  );
  const endOptions = useMemo(
    () => (startTime ? getEndOptions(startTime, timeOptions, reservedSlots) : []),
    [reservedSlots, startTime, timeOptions],
  );

  const { montoTotal, montoSenia } = useMemo(
    () => calcularMontos(startTime, endTime),
    [startTime, endTime],
  );

  const montoAbonado =
    tipoPago === 'total'
      ? montoTotal
      : tipoPago === 'senia'
      ? montoSenia
      : Number(montoPersonalizado) || 0;

  const isMontoValido = montoAbonado >= montoSenia && montoAbonado <= montoTotal;

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
      setShowPayment(false);
      setTipoPago('senia');
      setMontoPersonalizado('');
    }
  }, [
    initialEndTime,
    initialStartTime,
    reservedSlots,
    startOptions,
    timeOptions,
    visible,
  ]);

  const handleChangeStartTime = (option: string) => {
    const nextEndOptions = getEndOptions(option, timeOptions, reservedSlots);
    setStartTime(option);
    setEndTime(nextEndOptions[0] ?? '');
    setShowPayment(false);
    setTipoPago('senia');
  };

  const handleContinuarPago = () => {
    Keyboard.dismiss();
    setMontoPersonalizado(String(montoSenia));
    setShowPayment(true);
  };

  const handleConfirm = () => {
    if (!desk || !startTime || !endTime) return;
    onConfirm({
      desk,
      date: selectedDate,
      startTime,
      endTime,
      amount: montoAbonado,
    });
  };

  const handleClose = () => {
    setShowPayment(false);
    onClose();
  };

  const noAvailability = startOptions.length === 0;
  const canContinue = Boolean(startTime) && Boolean(endTime) && !noAvailability;

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cerrar confirmacion de reserva"
          style={styles.backdrop}
          onPress={handleClose}
        />

        <View style={styles.sheet}>
          <View style={styles.handle} />

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.header}>
              <AppText variant="subtitle" style={styles.title}>
                Confirmar Reserva
              </AppText>
              <IconButton
                accessibilityLabel="Cerrar confirmacion de reserva"
                icon="x"
                onPress={handleClose}
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

            {!showPayment ? (
              <>
                <View style={styles.optionGroup}>
                  <AppText variant="caption" color={colors.blackOverlay} style={styles.label}>
                    Hora inicio
                  </AppText>
                  <View style={styles.optionList}>
                    {startOptions.map((option) => (
                      <Pressable
                        key={option}
                        accessibilityRole="button"
                        onPress={() => handleChangeStartTime(option)}
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

                {noAvailability ? (
                  <AppText variant="caption" color={statusColors.error} style={styles.errorText}>
                    No hay horarios disponibles para este escritorio en la fecha seleccionada.
                  </AppText>
                ) : null}

                {canContinue ? (
                  <View style={styles.priceSummary}>
                    <View style={styles.priceRow}>
                      <AppText variant="caption" color={colors.blackOverlay}>
                        Precio total
                      </AppText>
                      <AppText variant="caption" style={styles.priceValue}>
                        {formatMoneda(montoTotal)}
                      </AppText>
                    </View>
                    <View style={styles.priceRow}>
                      <AppText variant="caption" color={colors.blackOverlay}>
                        Seña mínima (30%)
                      </AppText>
                      <AppText variant="caption" color={colors.primaryLight} style={styles.priceValue}>
                        {formatMoneda(montoSenia)}
                      </AppText>
                    </View>
                  </View>
                ) : null}
              </>
            ) : (
              <>
                <View style={styles.priceSummary}>
                  <View style={styles.priceRow}>
                    <AppText variant="caption" color={colors.blackOverlay}>
                      Precio total
                    </AppText>
                    <AppText variant="caption" style={styles.priceValue}>
                      {formatMoneda(montoTotal)}
                    </AppText>
                  </View>
                  <View style={styles.priceRow}>
                    <AppText variant="caption" color={colors.blackOverlay}>
                      Seña mínima (30%)
                    </AppText>
                    <AppText variant="caption" color={colors.primaryLight} style={styles.priceValue}>
                      {formatMoneda(montoSenia)}
                    </AppText>
                  </View>
                </View>

                <View style={styles.paymentBlock}>
                  <View style={styles.paymentBlockHeader}>
                    <Icon name="wallet" size={18} color={colors.primary} />
                    <AppText variant="body" style={styles.paymentBlockTitle}>
                      ¿Cuánto querés abonar?
                    </AppText>
                  </View>

                  <PaymentOptionRow
                    label="Pagar seña"
                    sublabel="Mínimo 30% del total"
                    amount={montoSenia}
                    selected={tipoPago === 'senia'}
                    onPress={() => setTipoPago('senia')}
                  />

                  <PaymentOptionRow
                    label="Pagar total"
                    sublabel="Sin saldo pendiente"
                    amount={montoTotal}
                    selected={tipoPago === 'total'}
                    onPress={() => setTipoPago('total')}
                  />

                  <PaymentOptionRow
                    label="Monto personalizado"
                    sublabel={`Entre ${formatMoneda(montoSenia)} y ${formatMoneda(montoTotal)}`}
                    amount={null}
                    selected={tipoPago === 'personalizado'}
                    onPress={() => setTipoPago('personalizado')}
                  >
                    {tipoPago === 'personalizado' ? (
                      <View style={styles.customInput}>
                        <AppText variant="caption" color={colors.primaryLight} style={styles.currencySymbol}>
                          $
                        </AppText>
                        <TextInput
                          style={styles.textInput}
                          value={montoPersonalizado}
                          onChangeText={setMontoPersonalizado}
                          keyboardType="numeric"
                          placeholder={String(montoSenia)}
                          placeholderTextColor={colors.primaryLight}
                        />
                      </View>
                    ) : null}
                  </PaymentOptionRow>

                  {tipoPago !== 'personalizado' || isMontoValido ? (
                    <View style={styles.saldoPendiente}>
                      <AppText variant="caption" color={colors.blackOverlay}>
                        Saldo pendiente
                      </AppText>
                      <AppText variant="caption" style={styles.priceValue}>
                        {formatMoneda(Math.max(0, montoTotal - montoAbonado))}
                      </AppText>
                    </View>
                  ) : null}
                </View>
              </>
            )}
          </ScrollView>

          {!showPayment ? (
            <Button
              title="Continuar al pago"
              disabled={!canContinue}
              onPress={handleContinuarPago}
            >
              <Icon name="chevronRight" size={18} color={colors.white} />
            </Button>
          ) : (
            <Button
              title={`Pagar ${formatMoneda(montoAbonado)} y Reservar`}
              disabled={!isMontoValido}
              onPress={handleConfirm}
            >
              <Icon name="chevronRight" size={18} color={colors.white} />
            </Button>
          )}
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
    maxHeight: '88%',
    paddingBottom: spacing.xxl,
    paddingTop: spacing.md,
  },
  scrollContent: {
    gap: spacing.lg,
    paddingHorizontal: spacing.screenX,
    paddingBottom: spacing.md,
  },
  handle: {
    alignSelf: 'center',
    backgroundColor: colors.border,
    borderRadius: radii.pill,
    height: 4,
    marginBottom: spacing.sm,
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
  priceSummary: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  priceRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priceValue: {
    fontWeight: '700',
  },
  paymentBlock: {
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.sm,
    overflow: 'hidden',
  },
  paymentBlockHeader: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  paymentBlockTitle: {
    fontWeight: '700',
  },
  paymentOption: {
    borderColor: colors.border,
    borderRadius: radii.md,
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    padding: spacing.md,
  },
  paymentOptionSelected: {
    backgroundColor: colors.softMint,
    borderColor: colors.primary,
    borderWidth: 1,
  },
  paymentOptionMain: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  radio: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 2,
    height: 18,
    justifyContent: 'center',
    width: 18,
  },
  radioSelected: {
    borderColor: colors.primary,
  },
  radioDot: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    height: 8,
    width: 8,
  },
  paymentOptionText: {
    flex: 1,
    gap: 2,
  },
  paymentOptionLabel: {
    fontWeight: '700',
  },
  paymentOptionAmount: {
    color: colors.primary,
    fontWeight: '800',
  },
  customInput: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  currencySymbol: {
    fontWeight: '700',
  },
  textInput: {
    color: colors.primary,
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    padding: 0,
  },
  saldoPendiente: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    paddingTop: spacing.sm,
    borderTopColor: colors.border,
    borderTopWidth: 1,
  },
});
