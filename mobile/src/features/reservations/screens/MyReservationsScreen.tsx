import { PropsWithChildren, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '../../../components/ui/AppText';
import { BottomTabBar } from '../../../components/ui/BottomTabBar';
import { ConfirmModal } from '../../../components/ui/ConfirmModal';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { StatusModal, StatusModalType } from '../../../components/ui/StatusModal';
import { colors, statusColors } from '../../../theme/colors';
import { radii, spacing } from '../../../theme/spacing';
import { DesksFeedbackCard } from '../../desks/components/DesksFeedbackCard';
import { ReservationEmptyState } from '../components/ReservationEmptyState';
import { ReservationList } from '../components/ReservationList';
import { useReservations } from '../hooks/useReservations';
import { Reservation } from '../types/reservation.types';

type ReservationActionStatus = 'idle' | 'loading' | 'success' | 'error';
type StatusFilter = 'all' | 'active' | 'completed' | 'cancelled';

function getStatusLabel(status: StatusFilter): string {
  if (status === 'all') return 'reservas';
  if (status === 'active') return 'reservas activas';
  if (status === 'completed') return 'reservas completadas';
  return 'reservas canceladas';
}

type MyReservationsScreenProps = {
  onPressDesks?: () => void;
  onPressPayments?: () => void;
  onPressSettings?: () => void;
  onPressLogout?: () => void;
  onReservationCancelled?: () => void;
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
  onPressDesks,
  onPressPayments,
  onPressSettings,
  onPressLogout,
  onReservationCancelled,
  refreshKey = 0,
}: MyReservationsScreenProps) {
  const [selectedFilter, setSelectedFilter] = useState<StatusFilter>('all');
  const [reservationToCancel, setReservationToCancel] = useState<Reservation | null>(null);
  const {
    actionStatus,
    activeReservations,
    clearActionStatus,
    errorMessage,
    handleCancelReservation: executeCancelReservation,
    isLoading,
    reservationHistory,
  } = useReservations(refreshKey, onReservationCancelled);

  const handleCancelReservation = (reservation: Reservation) => {
    setReservationToCancel(reservation);
  };

  const handleConfirmCancel = () => {
    if (reservationToCancel) {
      setReservationToCancel(null);
      void executeCancelReservation(reservationToCancel);
    }
  };

  const allReservations = [...activeReservations, ...reservationHistory];
  const filteredReservations = allReservations.filter((r) => {
    if (selectedFilter === 'all') return true;
    return r.status === selectedFilter;
  });

  const hasAnyReservation = allReservations.length > 0;
  const activeStatus =
    actionStatus === 'idle' ? null : cancellationStatusContent[actionStatus];

  return (
    <ScreenContainer>
      <View style={styles.layout}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <View style={styles.header}>
            <AppText variant="title">Mis Reservas</AppText>
            <AppText variant="caption" color={colors.primaryLight} style={styles.count}>
              {filteredReservations.length} {getStatusLabel(selectedFilter)}
            </AppText>
          </View>

          <View style={styles.filtersContainer}>
            <FilterChip
              label="Todas"
              selected={selectedFilter === 'all'}
              onPress={() => setSelectedFilter('all')}
            />
            <FilterChip
              label="Activas"
              selected={selectedFilter === 'active'}
              onPress={() => setSelectedFilter('active')}
            />
            <FilterChip
              label="Completadas"
              selected={selectedFilter === 'completed'}
              onPress={() => setSelectedFilter('completed')}
            />
            <FilterChip
              label="Canceladas"
              selected={selectedFilter === 'cancelled'}
              onPress={() => setSelectedFilter('cancelled')}
            />
          </View>

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
                  onCancel={selectedFilter === 'all' || selectedFilter === 'active' ? handleCancelReservation : undefined}
                />
              ) : (
                <ReservationEmptyState />
              )}
            </>
          )}
        </ScrollView>

        <BottomTabBar
          activeTab="reservations"
          onPressDesks={onPressDesks}
          onPressPayments={onPressPayments}
          onPressSettings={onPressSettings}
          onPressLogout={onPressLogout}
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
});
