import { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '../../../components/ui/AppText';
import { BottomTabBar } from '../../../components/ui/BottomTabBar';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { StatusModal, StatusModalType } from '../../../components/ui/StatusModal';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { DesksFeedbackCard } from '../../desks/components/DesksFeedbackCard';
import { ReservationEmptyState } from '../components/ReservationEmptyState';
import { ReservationList } from '../components/ReservationList';
import { useReservations } from '../hooks/useReservations';

type ReservationActionStatus = 'idle' | 'loading' | 'success' | 'error';

type MyReservationsScreenProps = {
  onPressDesks?: () => void;
  onPressProfile?: () => void;
  onPressLogout?: () => void;
  onPressSwitchAccount?: () => void;
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

export function MyReservationsScreen({
  onPressDesks,
  onPressProfile,
  onPressLogout,
  onPressSwitchAccount,
  refreshKey = 0,
}: MyReservationsScreenProps) {
  const {
    actionStatus,
    activeReservations,
    clearActionStatus,
    errorMessage,
    handleCancelReservation,
    isLoading,
    reservationHistory,
  } = useReservations(refreshKey);
  const hasAnyReservation =
    activeReservations.length > 0 || reservationHistory.length > 0;
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
              {activeReservations.length} reservas activas
            </AppText>
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
            </>
          )}
        </ScrollView>

        <BottomTabBar
          activeTab="reservations"
          onPressDesks={onPressDesks}
          onPressProfile={onPressProfile}
          onPressLogout={onPressLogout}
          onPressSwitchAccount={onPressSwitchAccount}
        />
      </View>

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
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    fontWeight: '900',
    letterSpacing: 0,
  },
});
