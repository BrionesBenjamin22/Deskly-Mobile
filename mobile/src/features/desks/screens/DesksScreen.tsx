import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '../../../components/ui/AppText';
import { BottomTabBar } from '../../../components/ui/BottomTabBar';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Icon } from '../../../components/ui/Icon';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { DateSelector } from '../components/DateSelector';
import { DeskList } from '../components/DeskList';
import { ReservationBottomSheet } from '../components/ReservationBottomSheet';
import { mockDesks } from '../data/mockDesks';
import { Desk } from '../types/desk.types';

export function DesksScreen() {
  const [selectedDesk, setSelectedDesk] = useState<Desk | null>(null);
  const desks = mockDesks;
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
    console.log('Reserva mock confirmada', payload);
    handleCloseReservation();
  };

  return (
    <ScreenContainer>
      <View style={styles.layout}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <AppText variant="title">Escritorios Disponibles</AppText>

          <DateSelector />

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

          {desks.length > 0 ? (
            <DeskList desks={desks} onReserve={handleOpenReservation} />
          ) : (
            <EmptyState />
          )}
        </ScrollView>

        <BottomTabBar activeTab="desks" />
      </View>

      <ReservationBottomSheet
        visible={Boolean(selectedDesk)}
        desk={selectedDesk}
        onClose={handleCloseReservation}
        onConfirm={handleConfirmReservation}
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
