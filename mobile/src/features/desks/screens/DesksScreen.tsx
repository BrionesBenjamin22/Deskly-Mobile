import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '../../../components/ui/AppText';
import { BottomTabBar } from '../../../components/ui/BottomTabBar';
import { Icon } from '../../../components/ui/Icon';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { StatusModal, StatusModalType } from '../../../components/ui/StatusModal';
import { colors } from '../../../theme/colors';
import { radii, spacing } from '../../../theme/spacing';
import { CalendarPicker } from '../components/CalendarPicker';
import { DateSelector, getDeskDateOptions, DeskDateOption } from '../components/DateSelector';
import { DesksFeedbackCard } from '../components/DesksFeedbackCard';
import { DeskList } from '../components/DeskList';
import { ReservationBottomSheet } from '../components/ReservationBottomSheet';
import { useAvailableDesks } from '../hooks/useAvailableDesks';
import { Desk, DeskZone, Locality, WorkArea } from '../types/desk.types';
import { listLocalities, listWorkAreas } from '../services/desks.service';
import {
  createReservation,
  listReservations,
  ReservationServiceError,
} from '../../reservations/services/reservations.service';
import { createPayment } from '../../payments/services/payments.service';
import { UserRole } from '../../auth/types/auth.types';

type ReservationUiStatus = 'idle' | 'loading' | 'success' | 'error';
type ZoneFilter = DeskZone | 'all';
type FilterDropdownId = 'startTime' | 'endTime' | 'zone' | 'locality' | 'area';

export type DeskAvailabilityContext = {
  date: string;
  startTime: string;
  endTime: string;
};

type DesksScreenProps = {
  accessToken: string;
  initialAvailabilityContext?: Partial<DeskAvailabilityContext>;
  selectedWorkArea?: WorkArea | null;
  onBackToWorkAreas?: (context: DeskAvailabilityContext) => void;
  onPressReservations?: () => void;
  onPressPayments?: () => void;
  onPressProfile?: () => void;
  onPressLogout?: () => void;
  onPressSwitchAccount?: () => void;
  onPressUserManagement?: () => void;
  onPressChangePassword?: () => void;
  userRole?: UserRole;
  onReservationCreated?: () => void;
  externalRefreshKey?: number;
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
    title: 'Reserva confirmada',
    description: 'Tu escritorio fue reservado correctamente.',
  },
  error: {
    type: 'error',
    title: 'No pudimos confirmar tu reserva',
    description:
      'Hubo un problema al procesarla. Revise su conexion e intente nuevamente.',
  },
};

const zoneOptions: { label: string; value: ZoneFilter }[] = [
  { label: 'Todas', value: 'all' },
  { label: 'Zona A', value: 'A' },
  { label: 'Zona B', value: 'B' },
  { label: 'Zona C', value: 'C' },
];

const allOption = { label: 'Todas', value: 'all' };

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

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(':').map(Number);

  return hours * 60 + minutes;
}

function getFriendlyReservationError(error: unknown) {
  if (error instanceof ReservationServiceError) {
    return error.message;
  }

  return 'Lo sentimos, no pudimos confirmar tu reserva. Revise los datos e intente nuevamente.';
}

function timesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string,
): boolean {
  return (
    timeToMinutes(start1) < timeToMinutes(end2) &&
    timeToMinutes(end1) > timeToMinutes(start2)
  );
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

function getFilterLabel<TItem extends { id: string; name: string }>(
  value: string,
  items: TItem[],
) {
  if (value === 'all') {
    return 'Todas';
  }

  return items.find((item) => item.id === value)?.name ?? 'Todas';
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
  accessToken,
  initialAvailabilityContext,
  selectedWorkArea,
  onBackToWorkAreas,
  onPressReservations,
  onPressPayments,
  onPressProfile,
  onPressLogout,
  onPressSwitchAccount,
  onPressUserManagement,
  onPressChangePassword,
  userRole,
  onReservationCreated,
  externalRefreshKey = 0,
}: DesksScreenProps) {
  const [selectedDesk, setSelectedDesk] = useState<Desk | null>(null);
  const [selectedDate, setSelectedDate] = useState(
    () => initialAvailabilityContext?.date ?? getDeskDateOptions()[0].id,
  );
  const [reservationStatus, setReservationStatus] =
    useState<ReservationUiStatus>('idle');
  const [reservationErrorMessage, setReservationErrorMessage] = useState(
    reservationStatusContent.error.description,
  );
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [startTime, setStartTime] = useState(
    () => initialAvailabilityContext?.startTime ?? '09:00',
  );
  const [endTime, setEndTime] = useState(
    () => initialAvailabilityContext?.endTime ?? '18:00',
  );
  const [selectedZone, setSelectedZone] = useState<ZoneFilter>('all');
  const [localities, setLocalities] = useState<Locality[]>([]);
  const [workAreas, setWorkAreas] = useState<WorkArea[]>([]);
  const [selectedLocalityId, setSelectedLocalityId] = useState('all');
  const [selectedAreaId, setSelectedAreaId] = useState('all');
  const [openDropdown, setOpenDropdown] = useState<FilterDropdownId | null>(null);
  const [availabilityRefreshKey, setAvailabilityRefreshKey] = useState(0);
  const [showCalendar, setShowCalendar] = useState(false);

  const quickDates = useMemo(() => getDeskDateOptions(new Date(), 30), []);
  const isCalendarDate = !quickDates.slice(0, 10).some((d) => d.id === selectedDate);
  const selectedWorkAreaLocalityId = selectedWorkArea?.localityId;
  const effectiveAreaId = selectedWorkArea?.id ?? selectedAreaId;
  const effectiveLocalityId =
    selectedWorkArea?.localityId ?? selectedLocalityId;

  useEffect(() => {
    if (!selectedWorkArea) {
      return;
    }

    setSelectedAreaId(selectedWorkArea.id);
    if (selectedWorkAreaLocalityId) {
      setSelectedLocalityId(selectedWorkAreaLocalityId);
    }
    setOpenDropdown(null);
  }, [selectedWorkArea, selectedWorkAreaLocalityId]);

  useEffect(() => {
    let isMounted = true;

    listLocalities()
      .then((items) => {
        if (isMounted) setLocalities(items);
      })
      .catch(() => {
        if (isMounted) setLocalities([]);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    listWorkAreas(selectedLocalityId === 'all' ? undefined : selectedLocalityId)
      .then((items) => {
        if (isMounted) setWorkAreas(items);
      })
      .catch(() => {
        if (isMounted) setWorkAreas([]);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedLocalityId]);

  const calendarDateLabel = useMemo(() => {
    if (!isCalendarDate) return null;
    const date = new Date(`${selectedDate}T00:00:00`);
    return new Intl.DateTimeFormat('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(date);
  }, [selectedDate, isCalendarDate]);

  const { desks, errorMessage, isLoading } = useAvailableDesks({
    date: selectedDate,
    startTime,
    endTime,
    refreshKey: availabilityRefreshKey + externalRefreshKey,
    ...(selectedZone === 'all' ? {} : { zone: selectedZone }),
    ...(effectiveLocalityId === 'all' ? {} : { localityId: effectiveLocalityId }),
    ...(effectiveAreaId === 'all' ? {} : { areaId: effectiveAreaId }),
  });
  const availableCount = desks.filter(
    (desk) => desk.enabled && desk.status === 'available',
  ).length;
  const startTimeOptions = timeOptions.slice(0, -1);
  const endTimeOptions = timeOptions.filter(
    (time) => timeToMinutes(time) > timeToMinutes(startTime),
  );
  const localityOptions = [
    allOption,
    ...localities.map((locality) => ({
      label: locality.name,
      value: locality.id,
    })),
  ];
  const areaOptions = [
    allOption,
    ...workAreas.map((area) => ({
      label: area.name,
      value: area.id,
    })),
  ];

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
    amount: number;
  }) => {
    handleCloseReservation();
    setReservationStatus('loading');
    setReservationErrorMessage(reservationStatusContent.error.description);

    try {
      const reservationGroups = await Promise.all([
        listReservations(accessToken, 1, 50, 'RESERVED'),
        listReservations(accessToken, 1, 50, 'ACTIVE'),
      ]);
      const allActive = reservationGroups.flatMap(
        (group) => group.reservations,
      );

      const conflict = allActive.find(
        (r) =>
          r.date === payload.date &&
          timesOverlap(r.startTime, r.endTime, payload.startTime, payload.endTime),
      );

      if (conflict) {
        setReservationErrorMessage(
          `Ya tenés una reserva activa en ${conflict.deskName} de ${conflict.startTime} a ${conflict.endTime}. Los horarios se superponen.`,
        );
        setReservationStatus('error');
        return;
      }

      const reservation = await createReservation(accessToken, {
        deskId: payload.desk.id,
        date: payload.date,
        startTime: payload.startTime,
        endTime: payload.endTime,
      });
      await createPayment({
        reservationId: reservation.id,
        date: payload.date,
        amount: payload.amount,
      });
      setAvailabilityRefreshKey((current) => current + 1);
      onReservationCreated?.();
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

  const handleClearFilters = () => {
    setStartTime('09:00');
    setEndTime('18:00');
    setSelectedZone('all');
    setSelectedLocalityId(selectedWorkArea?.localityId ?? 'all');
    setSelectedAreaId(selectedWorkArea?.id ?? 'all');
    setOpenDropdown(null);
  };

  const handleBackToWorkAreas = () => {
    onBackToWorkAreas?.({
      date: selectedDate,
      startTime,
      endTime,
    });
  };

  return (
    <ScreenContainer>
      <View style={styles.layout}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.scroll}
          contentContainerStyle={styles.content}
        >
          {selectedWorkArea ? (
            <Pressable
              accessibilityRole="button"
              onPress={handleBackToWorkAreas}
              style={({ pressed }) => [styles.backAction, pressed && styles.pressed]}
            >
              <AppText variant="caption" color={colors.primary} style={styles.backActionText}>
                Volver a areas
              </AppText>
            </Pressable>
          ) : null}

          <View style={styles.titleBlock}>
            <AppText variant="title">Escritorios Disponibles</AppText>
            {selectedWorkArea ? (
              <AppText variant="caption" color={colors.primaryLight} style={styles.areaContextText}>
                {selectedWorkArea.name}
                {selectedWorkArea.locality ? ` - ${selectedWorkArea.locality.name}` : ''}
              </AppText>
            ) : null}
          </View>

          <DateSelector selectedDate={selectedDate} onSelectDate={setSelectedDate} />

          {isCalendarDate && calendarDateLabel ? (
            <View style={styles.calendarDateBanner}>
              <Icon name="calendar" size={16} color={colors.primary} />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cambiar fecha del calendario"
                onPress={() => setShowCalendar(true)}
                style={styles.calendarDateBannerContent}
              >
                <AppText variant="caption" color={colors.primary} style={styles.calendarDateText}>
                  {calendarDateLabel.charAt(0).toUpperCase() + calendarDateLabel.slice(1)}
                </AppText>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Limpiar fecha del calendario"
                onPress={() => setSelectedDate(getDeskDateOptions()[0].id)}
                style={({ pressed }) => [styles.calendarDateClear, pressed && styles.pressed]}
              >
                <Icon name="x" size={14} color={colors.primaryLight} />
              </Pressable>
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Abrir selector de calendario"
              onPress={() => setShowCalendar(true)}
              style={({ pressed }) => [styles.calendarButton, pressed && styles.pressed]}
            >
              <Icon name="calendar" size={16} color={colors.primaryLight} />
              <AppText variant="caption" color={colors.primaryLight} style={styles.calendarButtonText}>
                Ver más fechas
              </AppText>
            </Pressable>
          )}

          <View style={styles.filtersHeader}>
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
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Limpiar filtros"
                onPress={handleClearFilters}
                style={({ pressed }) => [styles.clearFilters, pressed && styles.pressed]}
              >
                <Icon name="x" size={18} color={colors.primary} />
              </Pressable>
            ) : null}
          </View>

          {showAdvancedFilters ? (
            <View style={styles.filtersPanel}>
              <FilterDropdown
                id="startTime"
                label="Desde"
                valueLabel={startTime}
                options={startTimeOptions.map((time) => ({ label: time, value: time }))}
                openDropdown={openDropdown}
                onToggle={handleToggleDropdown}
                onSelect={(value) => {
                  setStartTime(value);
                  if (timeToMinutes(endTime) <= timeToMinutes(value)) {
                    const nextEndTime = timeOptions.find(
                      (time) => timeToMinutes(time) > timeToMinutes(value),
                    );
                    setEndTime(nextEndTime ?? '20:00');
                  }
                  setOpenDropdown(null);
                }}
              />

              <FilterDropdown
                id="endTime"
                label="Hasta"
                valueLabel={endTime}
                options={endTimeOptions.map((time) => ({ label: time, value: time }))}
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

              <FilterDropdown
                id="locality"
                label="Localidad"
                valueLabel={getFilterLabel(selectedLocalityId, localities)}
                options={localityOptions}
                openDropdown={openDropdown}
                onToggle={handleToggleDropdown}
                onSelect={(value) => {
                  setSelectedLocalityId(value);
                  setSelectedAreaId('all');
                  setOpenDropdown(null);
                }}
              />

              <FilterDropdown
                id="area"
                label="Area"
                valueLabel={getFilterLabel(selectedAreaId, workAreas)}
                options={areaOptions}
                openDropdown={openDropdown}
                onToggle={handleToggleDropdown}
                onSelect={(value) => {
                  setSelectedAreaId(value);
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
              title="Lo sentimos, no pudimos recuperar su informacion"
              description={errorMessage}
            />
          ) : desks.length > 0 ? (
            <DeskList
              desks={desks}
              selectedEndTime={endTime}
              selectedStartTime={startTime}
              onReserve={handleOpenReservation}
            />
          ) : (
            <DesksFeedbackCard
              icon="search"
              title="No hay escritorios disponibles para estos filtros"
              description="Intente con otra fecha u horario."
            />
          )}
        </ScrollView>

        <BottomTabBar
          activeTab="desks"
          onPressReservations={onPressReservations}
          onPressPayments={onPressPayments}
          onPressProfile={onPressProfile}
          onPressLogout={onPressLogout}
          onPressSwitchAccount={onPressSwitchAccount}
          onPressUserManagement={onPressUserManagement}
          onPressChangePassword={onPressChangePassword}
          userRole={userRole}
        />
      </View>

      <ReservationBottomSheet
        visible={Boolean(selectedDesk)}
        desk={selectedDesk}
        selectedDate={selectedDate}
        selectedDateLabel={selectedDateLabel}
        initialStartTime={startTime}
        initialEndTime={endTime}
        timeOptions={timeOptions}
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

      <CalendarPicker
        visible={showCalendar}
        onSelectDate={setSelectedDate}
        onClose={() => setShowCalendar(false)}
      />
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
  filtersHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 40,
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
  clearFilters: {
    alignItems: 'center',
    alignSelf: 'flex-end',
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 34,
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
  calendarButton: {
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 40,
    paddingHorizontal: spacing.md,
  },
  calendarButtonText: {
    fontWeight: '700',
  },
  calendarDateBanner: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: colors.softMint,
    borderColor: colors.primary,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 44,
    paddingHorizontal: spacing.md,
  },
  calendarDateBannerContent: {
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
  },
  calendarDateText: {
    fontWeight: '700',
  },
  calendarDateClear: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 32,
  },
  backAction: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  backActionText: {
    fontWeight: '800',
  },
  titleBlock: {
    gap: spacing.xs,
  },
  areaContextText: {
    fontWeight: '700',
  },
});
