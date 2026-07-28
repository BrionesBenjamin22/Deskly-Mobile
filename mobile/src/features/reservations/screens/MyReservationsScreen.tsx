import { PropsWithChildren, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '../../../components/ui/AppText';
import { BottomTabBar } from '../../../components/ui/BottomTabBar';
import { ConfirmModal } from '../../../components/ui/ConfirmModal';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { StatusModal, StatusModalType } from '../../../components/ui/StatusModal';
import { colors, statusColors } from '../../../theme/colors';
import { radii, spacing } from '../../../theme/spacing';
import { CalendarPicker } from '../../desks/components/CalendarPicker';
import { DateSelector, getDeskDateOptions } from '../../desks/components/DateSelector';
import { DesksFeedbackCard } from '../../desks/components/DesksFeedbackCard';
import { PenaltyReasonModal } from '../../penalties/components/PenaltyReasonModal';
import { useRegisterAbsence } from '../../penalties/hooks/useRegisterAbsence';
import { UserRole } from '../../auth/types/auth.types';
import { ReservationEmptyState } from '../components/ReservationEmptyState';
import { ReservationList } from '../components/ReservationList';
import { useReservations } from '../hooks/useReservations';
import { useValidateArrival } from '../hooks/useValidateArrival';
import { Reservation } from '../types/reservation.types';

type ReservationActionStatus = 'idle' | 'loading' | 'success' | 'error';
type StatusFilter =
  | 'all'
  | 'reserved'
  | 'active'
  | 'completed'
  | 'cancelled';

function getStatusLabel(status: StatusFilter): string {
  if (status === 'all') return 'reservas';
  if (status === 'reserved') return 'reservas reservadas';
  if (status === 'active') return 'reservas activas';
  if (status === 'completed') return 'reservas finalizadas';
  return 'reservas canceladas';
}

type MyReservationsScreenProps = {
  accessToken: string;
  userRole: UserRole;
  onPressDesks?: () => void;
  onPressPayments?: () => void;
  onPressProfile?: () => void;
  onPressLogout?: () => void;
  onReservationCancelled?: () => void;
  onPressSwitchAccount?: () => void;
  onPressUserManagement?: () => void;
  onPressChangePassword?: () => void;
  refreshKey?: number;
};

const cancellationStatusContent: Record<
  Exclude<ReservationActionStatus, 'idle'>,
  { type: StatusModalType; title: string; description: string }
> = {
  loading: {
    type: 'loading',
    title: 'Procesando cancelación...',
    description: 'Estamos cancelando tu reserva. Esto puede tomar unos segundos.',
  },
  success: {
    type: 'success',
    title: 'Reserva cancelada',
    description: 'Tu reserva fue cancelada correctamente.',
  },
  error: {
    type: 'error',
    title: 'No pudimos cancelar tu reserva',
    description:
      'Hubo un problema al procesar la cancelación. Intentá nuevamente en unos segundos.',
  },
};

function Section({ title, children }: PropsWithChildren<{ title: string }>) {
  return (
    <View style={styles.section}>
      <AppText variant="caption" color={colors.primaryLight} style={styles.sectionTitle}>
        {title}
      </AppText>
      {children}
    </View>
  );
}

type FilterChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

function FilterChip({ label, selected, onPress }: FilterChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.filterChip,
        selected && styles.filterChipSelected,
        pressed && styles.pressed,
      ]}
    >
      <AppText
        variant="caption"
        color={selected ? colors.white : colors.primary}
        style={styles.filterChipText}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

export function MyReservationsScreen({
  accessToken,
  userRole,
  onPressDesks,
  onPressPayments,
  onPressProfile,
  onPressLogout,
  onReservationCancelled,
  onPressSwitchAccount,
  onPressUserManagement,
  onPressChangePassword,
  refreshKey = 0,
}: MyReservationsScreenProps) {
  const [selectedFilter, setSelectedFilter] = useState<StatusFilter>('all');
  const [reservationToCancel, setReservationToCancel] = useState<Reservation | null>(null);
  const [reservationToPenalize, setReservationToPenalize] = useState<Reservation | null>(null);
  const [penaltyReason, setPenaltyReason] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);

  const todayId = useMemo(() =>
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Argentina/Buenos_Aires',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date()),
  []);

  const [selectedDate, setSelectedDate] = useState(todayId);

  const quickDates = useMemo(() => getDeskDateOptions(new Date(), 10), []);
  const isCalendarDate = !quickDates.some((d) => d.id === selectedDate);
  const isToday = selectedDate === todayId;

  const selectedDateLabel = useMemo(() => {
    const date = new Date(`${selectedDate}T12:00:00`);
    return new Intl.DateTimeFormat('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(date);
  }, [selectedDate]);

  const {
    actionStatus,
    activeReservations,
    clearActionStatus,
    errorMessage,
    handleCancelReservation: executeCancelReservation,
    isLoading,
    reservationHistory,
    refresh,
  } = useReservations(
    accessToken,
    refreshKey,
    onReservationCancelled,
    userRole === 'GESTOR',
    userRole === 'GESTOR' ? selectedDate : undefined,
  );

  const penaltyAction = useRegisterAbsence(accessToken, async () => {
    await refresh();
    onReservationCancelled?.();
  });
  const arrivalAction = useValidateArrival(accessToken, async () => {
    await refresh();
  });

  const handleCancelReservation = (reservation: Reservation) => {
    if (userRole === 'GESTOR') {
      setPenaltyReason('');
      setReservationToPenalize(reservation);
      return;
    }
    setReservationToCancel(reservation);
  };

  const handleConfirmAbsence = async () => {
    if (!reservationToPenalize) return;
    const registered = await penaltyAction.submit(reservationToPenalize.id, penaltyReason);
    if (registered) {
      setReservationToPenalize(null);
      setPenaltyReason('');
    }
  };

  const handleConfirmCancel = () => {
    if (reservationToCancel) {
      setReservationToCancel(null);
      void executeCancelReservation(reservationToCancel);
    }
  };

  const allReservations = [...activeReservations, ...reservationHistory];
  const filteredReservations = allReservations.filter((r) => {
    if (userRole === 'GESTOR' || selectedFilter === 'all') return true;
    return r.status === selectedFilter;
  });

  const activeStatus =
    actionStatus === 'idle' ? null : cancellationStatusContent[actionStatus];
  const isManagerEmpty =
    userRole === 'GESTOR' &&
    !isLoading &&
    !errorMessage &&
    filteredReservations.length === 0;

  return (
    <ScreenContainer>
      <View style={styles.layout}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <View style={styles.header}>
            <AppText variant="title">
              {userRole === 'GESTOR'
                ? (isToday ? 'Reservas activas de hoy' : `Reservas del ${selectedDateLabel}`)
                : 'Mis Reservas'}
            </AppText>
            {!isManagerEmpty && (
              <AppText variant="caption" color={colors.primaryLight} style={styles.count}>
                {userRole === 'GESTOR'
                  ? `${filteredReservations.length} reservas para gestionar`
                  : `${filteredReservations.length} ${getStatusLabel(selectedFilter)}`}
              </AppText>
            )}
          </View>

          {userRole === 'GESTOR' && (
            <View style={styles.dateSection}>
              {isCalendarDate ? (
                <View style={styles.calendarDateBanner}>
                  <AppText variant="body" color={colors.primary} style={styles.calendarDateText}>
                    {selectedDateLabel}
                  </AppText>
                  <Pressable onPress={() => setSelectedDate(todayId)} style={styles.clearDateButton}>
                    <AppText variant="caption" color={colors.primaryLight}>Ver hoy</AppText>
                  </Pressable>
                </View>
              ) : (
                <DateSelector selectedDate={selectedDate} onSelectDate={setSelectedDate} />
              )}
              <Pressable onPress={() => setShowCalendar(true)} style={styles.calendarTrigger}>
                <AppText variant="caption" color={colors.primaryLight}>Ver más fechas</AppText>
              </Pressable>
            </View>
          )}

          <CalendarPicker
            visible={showCalendar}
            onSelectDate={(date) => {
              setSelectedDate(date);
              setShowCalendar(false);
            }}
            onClose={() => setShowCalendar(false)}
          />

          {userRole !== 'GESTOR' ? <View style={styles.filtersContainer}>
            <FilterChip
              label="Todas"
              selected={selectedFilter === 'all'}
              onPress={() => setSelectedFilter('all')}
            />
            <FilterChip
              label="Reservadas"
              selected={selectedFilter === 'reserved'}
              onPress={() => setSelectedFilter('reserved')}
            />
            <FilterChip
              label="Activas"
              selected={selectedFilter === 'active'}
              onPress={() => setSelectedFilter('active')}
            />
            <FilterChip
              label="Finalizadas"
              selected={selectedFilter === 'completed'}
              onPress={() => setSelectedFilter('completed')}
            />
            <FilterChip
              label="Canceladas"
              selected={selectedFilter === 'cancelled'}
              onPress={() => setSelectedFilter('cancelled')}
            />
          </View> : null}

          {isLoading ? (
            <DesksFeedbackCard
              icon="loader"
              title="Cargando reservas"
              description="Estamos consultando tus reservas en Deskly."
            />
          ) : errorMessage ? (
            <DesksFeedbackCard
              icon="circleAlert"
              title="Lo sentimos, no pudimos recuperar sus reservas"
              description={errorMessage}
            />
          ) : (
            <>
              {filteredReservations.length > 0 ? (
                <ReservationList
                  reservations={filteredReservations}
                  onCancel={handleCancelReservation}
                  onValidateArrival={
                    userRole === 'GESTOR'
                      ? (reservation) => void arrivalAction.submit(reservation.id)
                      : undefined
                  }
                  managerView={userRole === 'GESTOR'}
                />
              ) : (
                userRole === 'GESTOR' ? (
                  <View style={styles.managerEmptyState}>
                    <AppText variant="subtitle" color={colors.primaryLight}>
                      {isToday
                        ? 'No hay reservas para hoy'
                        : `No hay reservas para el ${selectedDateLabel}`}
                    </AppText>
                  </View>
                ) : (
                  <ReservationEmptyState />
                )
              )}
            </>
          )}
        </ScrollView>

        <BottomTabBar
          activeTab="reservations"
          userRole={userRole}
          onPressDesks={onPressDesks}
          onPressPayments={onPressPayments}
          onPressProfile={onPressProfile}
          onPressLogout={onPressLogout}
          onPressSwitchAccount={onPressSwitchAccount}
          onPressUserManagement={onPressUserManagement}
          onPressChangePassword={onPressChangePassword}
        />
      </View>

      <ConfirmModal
        visible={reservationToCancel !== null}
        title="¿Cancelar reserva?"
        description={
          reservationToCancel
            ? `¿Estás seguro de que deseas cancelar la reserva de ${reservationToCancel.deskName} del ${reservationToCancel.dateLabel}?`
            : undefined
        }
        confirmLabel="Sí, cancelar"
        cancelLabel="No, mantener"
        destructive
        icon="circleAlert"
        onConfirm={handleConfirmCancel}
        onCancel={() => setReservationToCancel(null)}
      />

      <PenaltyReasonModal
        visible={reservationToPenalize !== null}
        reason={penaltyReason}
        onChangeReason={setPenaltyReason}
        onConfirm={() => void handleConfirmAbsence()}
        onCancel={() => {
          setReservationToPenalize(null);
          setPenaltyReason('');
        }}
      />

      {penaltyAction.status !== 'idle' ? (
        <StatusModal
          visible
          type={penaltyAction.status === 'loading' ? 'loading' : penaltyAction.status}
          title={
            penaltyAction.status === 'loading'
              ? 'Registrando infraccion...'
              : penaltyAction.status === 'success'
                ? 'Infraccion registrada'
                : 'No pudimos registrar la infraccion'
          }
          description={
            penaltyAction.status === 'success'
              ? 'La reserva fue cancelada y el antecedente quedo registrado correctamente.'
              : penaltyAction.errorMessage ?? 'Revise los datos e intente nuevamente.'
          }
          onClose={penaltyAction.status === 'loading' ? undefined : penaltyAction.clearStatus}
        />
      ) : null}

      {arrivalAction.status !== 'idle' ? (
        <StatusModal
          visible
          type={arrivalAction.status === 'loading' ? 'loading' : arrivalAction.status}
          title={
            arrivalAction.status === 'loading'
              ? 'Validando llegada...'
              : arrivalAction.status === 'success'
                ? 'Llegada validada'
                : 'No pudimos validar la llegada'
          }
          description={
            arrivalAction.status === 'success'
              ? 'La llegada del miembro quedo registrada correctamente.'
              : arrivalAction.errorMessage ?? 'Revise la reserva e intente nuevamente.'
          }
          onClose={arrivalAction.status === 'loading' ? undefined : arrivalAction.clearStatus}
        />
      ) : null}

      {activeStatus ? (
        <StatusModal
          visible
          type={activeStatus.type}
          title={activeStatus.title}
          description={activeStatus.description}
          onClose={
            actionStatus === 'loading' ? undefined : () => clearActionStatus()
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
    gap: spacing.xl,
    paddingBottom: spacing.md,
  },
  header: {
    gap: spacing.xs,
  },
  count: {
    fontWeight: '700',
  },
  filtersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  filterChip: {
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    minHeight: 34,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  filterChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.75,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    fontWeight: '900',
    letterSpacing: 0,
  },
  managerEmptyState: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 320,
  },
  dateSection: {
    gap: spacing.sm,
  },
  calendarDateBanner: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  calendarDateText: {
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  clearDateButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  calendarTrigger: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
  },
});
