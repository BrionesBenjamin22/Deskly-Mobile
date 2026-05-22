import { PropsWithChildren, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '../../../components/ui/AppText';
import { BottomTabBar } from '../../../components/ui/BottomTabBar';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { StatusModal, StatusModalType } from '../../../components/ui/StatusModal';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { ReservationEmptyState } from '../components/ReservationEmptyState';
import { ReservationList } from '../components/ReservationList';
import {
  mockActiveReservations,
  mockReservationHistory,
} from '../data/mockReservations';
import { Reservation } from '../types/reservation.types';

type ReservationActionStatus = 'idle' | 'loading' | 'success' | 'error';

type MyReservationsScreenProps = {
  onPressDesks?: () => void;
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

export function MyReservationsScreen({ onPressDesks }: MyReservationsScreenProps) {
  const activeReservations = mockActiveReservations;
  const reservationHistory = mockReservationHistory;
  const [cancellationStatus, setCancellationStatus] =
    useState<ReservationActionStatus>('idle');
  const hasAnyReservation =
    activeReservations.length > 0 || reservationHistory.length > 0;

  const handleCancelReservation = (reservation: Reservation) => {
    console.log('Cancelar reserva', reservation.id);
    setCancellationStatus('loading');

    setTimeout(() => {
      setCancellationStatus('success');
    }, 1200);
  };

  const activeStatus =
    cancellationStatus === 'idle'
      ? null
      : cancellationStatusContent[cancellationStatus];

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
              {activeReservations.length} reservas activas
            </AppText>
          </View>

          {activeReservations.length > 0 ? (
            <Section title="PRÓXIMAS">
              <ReservationList
                reservations={activeReservations}
                onCancel={handleCancelReservation}
              />
            </Section>
          ) : null}

          <Section title="HISTORIAL">
            {hasAnyReservation ? (
              <ReservationList reservations={reservationHistory} />
            ) : (
              <ReservationEmptyState />
            )}
          </Section>
        </ScrollView>

        <BottomTabBar activeTab="reservations" onPressDesks={onPressDesks} />
      </View>

      {activeStatus ? (
        <StatusModal
          visible
          type={activeStatus.type}
          title={activeStatus.title}
          description={activeStatus.description}
          onClose={
            cancellationStatus === 'loading'
              ? undefined
              : () => setCancellationStatus('idle')
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
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    fontWeight: '900',
    letterSpacing: 0,
  },
});
