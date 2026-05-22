import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '../../../components/ui/AppText';
import { BottomTabBar } from '../../../components/ui/BottomTabBar';
import { Icon } from '../../../components/ui/Icon';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { StatusModal, StatusModalType } from '../../../components/ui/StatusModal';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { DateSelector, getDeskDateOptions } from '../components/DateSelector';
import { DesksFeedbackCard } from '../components/DesksFeedbackCard';
import { DeskList } from '../components/DeskList';
import { ReservationBottomSheet } from '../components/ReservationBottomSheet';
import { useAvailableDesks } from '../hooks/useAvailableDesks';
import { Desk } from '../types/desk.types';

type ReservationUiStatus = 'idle' | 'loading' | 'success' | 'error';

type DesksScreenProps = {
  onPressReservations?: () => void;
  onPressSettings?: () => void;
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

export function DesksScreen({
  onPressReservations,
  onPressSettings,
}: DesksScreenProps) {
  const [selectedDesk, setSelectedDesk] = useState<Desk | null>(null);
  const [selectedDate, setSelectedDate] = useState(
    () => getDeskDateOptions()[0].id,
  );
  const [reservationStatus, setReservationStatus] =
    useState<ReservationUiStatus>('idle');
  const { desks, errorMessage, isLoading } = useAvailableDesks({
    date: selectedDate,
    startTime: '09:00',
    endTime: '18:00',
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

  const handleConfirmReservation = (payload: {
    desk: Desk;
    dateLabel: string;
    startTime: string;
    endTime: string;
  }) => {
    console.log('Reserva mock en proceso', payload);
    handleCloseReservation();
    setReservationStatus('loading');

    setTimeout(() => {
      setReservationStatus('success');
    }, 1200);
  };

  const activeStatus =
    reservationStatus === 'idle'
      ? null
      : reservationStatusContent[reservationStatus];

  return (
    <ScreenContainer>
      <View style={styles.layout}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <AppText variant="title">Escritorios Disponibles</AppText>

          <DateSelector selectedDate={selectedDate} onSelectDate={setSelectedDate} />

          <Pressable
            accessibilityRole="button"
            onPress={() => console.log('Filtros avanzados')}
            style={({ pressed }) => [styles.filters, pressed && styles.pressed]}
          >
            <Icon name="filter" size={18} color={colors.primary} />
            <AppText variant="body" color={colors.primary} style={styles.filtersText}>
              Filtros avanzados
            </AppText>
          </Pressable>

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
        />
      </View>

      <ReservationBottomSheet
        visible={Boolean(selectedDesk)}
        desk={selectedDesk}
        onClose={handleCloseReservation}
        onConfirm={handleConfirmReservation}
      />

      {activeStatus ? (
        <StatusModal
          visible
          type={activeStatus.type}
          title={activeStatus.title}
          description={activeStatus.description}
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
    paddingBottom: spacing.md,
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
});
