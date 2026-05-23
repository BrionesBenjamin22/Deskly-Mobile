import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '../../../components/ui/AppText';
import { BottomTabBar } from '../../../components/ui/BottomTabBar';
import { Icon } from '../../../components/ui/Icon';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { StatusModal, StatusModalType } from '../../../components/ui/StatusModal';
import { colors } from '../../../theme/colors';
import { radii, spacing } from '../../../theme/spacing';
import { DateSelector, getDeskDateOptions } from '../components/DateSelector';
import { DesksFeedbackCard } from '../components/DesksFeedbackCard';
import { DeskList } from '../components/DeskList';
import { ReservationBottomSheet } from '../components/ReservationBottomSheet';
import { useAvailableDesks } from '../hooks/useAvailableDesks';
import { Desk, DeskZone } from '../types/desk.types';
import {
  createReservation,
  ReservationServiceError,
} from '../../reservations/services/reservations.service';

type ReservationUiStatus = 'idle' | 'loading' | 'success' | 'error';
type ZoneFilter = DeskZone | 'all';
type FilterDropdownId = 'startTime' | 'endTime' | 'zone';

type DesksScreenProps = {
  onPressReservations?: () => void;
  onPressSettings?: () => void;
  onPressLogout?: () => void;
};

const reservationStatusContent: Record<
  Exclude<ReservationUiStatus, 'idle'>,
  { type: StatusModalType; title: string; description: string }
> = {
  loading: {
    type: 'loading',
    title: 'Procesando reserva...',
    description: 'Estamos confirmando tu reserva. Esto puede tomar unos segundos.',
  },
  success: {
    type: 'success',
    title: '¡Reserva confirmada!',
    description: 'Tu escritorio ha sido reservado correctamente.',
  },
  error: {
    type: 'error',
    title: 'No pudimos confirmar tu reserva',
    description:
      'Hubo un problema al procesarla. Revisá tu conexión e intentá nuevamente.',
  },
};

const zoneOptions: { label: string; value: ZoneFilter }[] = [
  { label: 'Todas', value: 'all' },
  { label: 'Zona A', value: 'A' },
  { label: 'Zona B', value: 'B' },
  { label: 'Zona C', value: 'C' },
];

const timeOptions = [
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00',
];

function getFriendlyReservationError(error: unknown) {
  if (error instanceof ReservationServiceError) {
    return error.message;
  }

  return 'Lo sentimos, no pudimos confirmar tu reserva. Revise los datos e intente nuevamente.';
}

function getSelectedDateLabel(dateValue: string) {
  const date = new Date(`${dateValue}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function getZoneFilterLabel(value: ZoneFilter) {
  return zoneOptions.find((option) => option.value === value)?.label ?? 'Todas';
}

type FilterDropdownProps<TValue extends string> = {
  id: FilterDropdownId;
  label: string;
  valueLabel: string;
  options: { label: string; value: TValue }[];
  openDropdown: FilterDropdownId | null;
  onToggle: (id: FilterDropdownId) => void;
  onSelect: (value: TValue) => void;
};

function FilterDropdown<TValue extends string>({
  id,
  label,
  valueLabel,
  options,
  openDropdown,
  onToggle,
  onSelect,
}: FilterDropdownProps<TValue>) {
  const isOpen = openDropdown === id;

  return (
    <View style={styles.dropdownField}>
      <AppText variant="caption" color={colors.blackOverlay} style={styles.dropdownLabel}>
        {label}
      </AppText>

      <Pressable
        accessibilityRole="button"
        onPress={() => onToggle(id)}
        style={({ pressed }) => [
          styles.dropdownPill,
          isOpen && styles.dropdownPillOpen,
          pressed && styles.pressed,
        ]}
      >
        <AppText
          variant="caption"
          color={colors.primary}
          numberOfLines={1}
          style={styles.dropdownPillText}
        >
          {valueLabel}
        </AppText>
        <Icon name="chevronDown" size={16} color={colors.primaryLight} />
      </Pressable>

      {isOpen ? (
        <View style={styles.dropdownMenu}>
          <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
            {options.map((option) => (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                onPress={() => onSelect(option.value)}
                style={({ pressed }) => [
                  styles.dropdownOption,
                  pressed && styles.dropdownOptionPressed,
                ]}
              >
                <AppText
                  variant="caption"
                  color={colors.primary}
                  numberOfLines={1}
                  style={styles.dropdownOptionText}
                >
                  {option.label}
                </AppText>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

export function DesksScreen({
  onPressReservations,
  onPressSettings,
  onPressLogout,
}: DesksScreenProps) {
  const [selectedDesk, setSelectedDesk] = useState<Desk | null>(null);
  const [selectedDate, setSelectedDate] = useState(
    () => getDeskDateOptions()[0].id,
  );
  const [reservationStatus, setReservationStatus] =
    useState<ReservationUiStatus>('idle');
  const [reservationErrorMessage, setReservationErrorMessage] = useState(
    reservationStatusContent.error.description,
  );
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const [selectedZone, setSelectedZone] = useState<ZoneFilter>('all');
  const [openDropdown, setOpenDropdown] = useState<FilterDropdownId | null>(null);
  const { desks, errorMessage, isLoading } = useAvailableDesks({
    date: selectedDate,
    startTime,
    endTime,
    ...(selectedZone === 'all' ? {} : { zone: selectedZone }),
  });
  const availableCount = desks.filter(
    (desk) => desk.enabled && desk.status === 'available',
  ).length;

  const handleOpenReservation = (desk: Desk) => {
    setSelectedDesk(desk);
  };

  const handleCloseReservation = () => {
    setSelectedDesk(null);
  };

  const handleConfirmReservation = async (payload: {
    desk: Desk;
    date: string;
    startTime: string;
    endTime: string;
  }) => {
    handleCloseReservation();
    setReservationStatus('loading');
    setReservationErrorMessage(reservationStatusContent.error.description);

    try {
      await createReservation({
        deskId: payload.desk.id,
        date: payload.date,
        startTime: payload.startTime,
        endTime: payload.endTime,
      });
      setReservationStatus('success');
    } catch (error) {
      setReservationErrorMessage(getFriendlyReservationError(error));
      setReservationStatus('error');
    }
  };

  const activeStatus =
    reservationStatus === 'idle'
      ? null
      : reservationStatusContent[reservationStatus];
  const selectedDateLabel = getSelectedDateLabel(selectedDate);

  const handleToggleDropdown = (id: FilterDropdownId) => {
    setOpenDropdown((current) => (current === id ? null : id));
  };

  return (
    <ScreenContainer>
      <View style={styles.layout}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.scroll}
          contentContainerStyle={styles.content}
        >
          <AppText variant="title">Escritorios Disponibles</AppText>

          <DateSelector selectedDate={selectedDate} onSelectDate={setSelectedDate} />

          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setOpenDropdown(null);
              setShowAdvancedFilters((current) => !current);
            }}
            style={({ pressed }) => [styles.filters, pressed && styles.pressed]}
          >
            <AppText variant="body" color={colors.primary} style={styles.filtersText}>
              Filtros avanzados
            </AppText>
            <Icon name="search" size={18} color={colors.primary} />
          </Pressable>

          {showAdvancedFilters ? (
            <View style={styles.filtersPanel}>
              <FilterDropdown
                id="startTime"
                label="Desde"
                valueLabel={startTime}
                options={timeOptions.map((time) => ({ label: time, value: time }))}
                openDropdown={openDropdown}
                onToggle={handleToggleDropdown}
                onSelect={(value) => {
                  setStartTime(value);
                  setOpenDropdown(null);
                }}
              />

              <FilterDropdown
                id="endTime"
                label="Hasta"
                valueLabel={endTime}
                options={timeOptions.map((time) => ({ label: time, value: time }))}
                openDropdown={openDropdown}
                onToggle={handleToggleDropdown}
                onSelect={(value) => {
                  setEndTime(value);
                  setOpenDropdown(null);
                }}
              />

              <FilterDropdown
                id="zone"
                label="Zona"
                valueLabel={getZoneFilterLabel(selectedZone)}
                options={zoneOptions}
                openDropdown={openDropdown}
                onToggle={handleToggleDropdown}
                onSelect={(value) => {
                  setSelectedZone(value);
                  setOpenDropdown(null);
                }}
              />
            </View>
          ) : null}

          <View style={styles.separator} />

          <AppText variant="caption" color={colors.blackOverlay}>
            {availableCount} escritorios disponibles
          </AppText>

          {isLoading ? (
            <DesksFeedbackCard
              icon="loader"
              title="Cargando escritorios"
              description="Estamos consultando la disponibilidad para la fecha seleccionada."
            />
          ) : errorMessage ? (
            <DesksFeedbackCard
              icon="circleAlert"
              title="Lo sentimos, no pudimos recuperar su información"
              description={errorMessage}
            />
          ) : desks.length > 0 ? (
            <DeskList desks={desks} onReserve={handleOpenReservation} />
          ) : (
            <DesksFeedbackCard
              icon="search"
              title="No hay escritorios disponibles para estos filtros"
              description="Intentá con otra fecha u horario."
            />
          )}
        </ScrollView>

        <BottomTabBar
          activeTab="desks"
          onPressReservations={onPressReservations}
          onPressSettings={onPressSettings}
          onPressLogout={onPressLogout}
        />
      </View>

      <ReservationBottomSheet
        visible={Boolean(selectedDesk)}
        desk={selectedDesk}
        selectedDate={selectedDate}
        selectedDateLabel={selectedDateLabel}
        initialStartTime={startTime}
        initialEndTime={endTime}
        onClose={handleCloseReservation}
        onConfirm={handleConfirmReservation}
      />

      {activeStatus ? (
        <StatusModal
          visible
          type={activeStatus.type}
          title={activeStatus.title}
          description={
            reservationStatus === 'error'
              ? reservationErrorMessage
              : activeStatus.description
          }
          onClose={
            reservationStatus === 'loading'
              ? undefined
              : () => setReservationStatus('idle')
          }
        />
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  layout: {
    flex: 1,
    gap: spacing.md,
  },
  content: {
    gap: spacing.lg,
    overflow: 'visible',
    paddingBottom: spacing.md,
  },
  scroll: {
    overflow: 'visible',
  },
  filters: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 40,
    paddingRight: spacing.sm,
  },
  filtersText: {
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.75,
  },
  separator: {
    backgroundColor: colors.border,
    height: 1,
  },
  filtersPanel: {
    alignItems: 'flex-start',
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    elevation: 8,
    flexDirection: 'row',
    gap: spacing.md,
    overflow: 'visible',
    padding: spacing.md,
    zIndex: 20,
  },
  dropdownField: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
    position: 'relative',
    zIndex: 30,
  },
  dropdownLabel: {
    fontWeight: '700',
  },
  dropdownPill: {
    alignItems: 'center',
    backgroundColor: colors.gray,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'space-between',
    minHeight: 34,
    paddingHorizontal: spacing.md,
  },
  dropdownPillOpen: {
    borderColor: colors.primaryLight,
  },
  dropdownPillText: {
    flex: 1,
    fontWeight: '800',
  },
  dropdownMenu: {
    backgroundColor: colors.gray,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    elevation: 12,
    left: 0,
    maxHeight: 176,
    overflow: 'hidden',
    position: 'absolute',
    right: 0,
    top: 56,
    zIndex: 50,
  },
  dropdownOption: {
    minHeight: 34,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  dropdownOptionPressed: {
    backgroundColor: colors.softMint,
  },
  dropdownOptionText: {
    fontWeight: '700',
  },
});
