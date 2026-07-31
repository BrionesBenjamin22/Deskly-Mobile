import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { AppText } from '../../../components/ui/AppText';
import { BottomTabBar } from '../../../components/ui/BottomTabBar';
import { Icon } from '../../../components/ui/Icon';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { colors } from '../../../theme/colors';
import { radii, spacing } from '../../../theme/spacing';
import { usePullToRefresh } from '../../../hooks/usePullToRefresh';
import { CalendarPicker } from '../components/CalendarPicker';
import { DateSelector, getDeskDateOptions } from '../components/DateSelector';
import { DesksFeedbackCard } from '../components/DesksFeedbackCard';
import { LocalityFilter } from '../components/LocalityFilter';
import { LocalitySection } from '../components/LocalitySection';
import {
  DeskServiceError,
  listAvailableWorkAreas,
  listLocalities,
  listWorkAreas,
} from '../services/desks.service';
import { DeskAvailabilityContext } from './DesksScreen';
import { Locality, WorkArea } from '../types/desk.types';

type WorkAreasScreenProps = {
  initialAvailabilityContext?: Partial<DeskAvailabilityContext>;
  refreshKey?: number;
  onSelectWorkArea: (area: WorkArea, context: DeskAvailabilityContext) => void;
  onPressReservations?: () => void;
  onPressPayments?: () => void;
  onPressProfile?: () => void;
  onPressLogout?: () => void;
  onPressSwitchAccount?: () => void;
  onPressUserManagement?: () => void;
  onPressChangePassword?: () => void;
};

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

function getFriendlyErrorMessage(error: unknown) {
  if (error instanceof DeskServiceError) {
    return error.message;
  }

  return 'Lo sentimos, no pudimos recuperar las areas de trabajo. Intente nuevamente.';
}

export function WorkAreasScreen({
  initialAvailabilityContext,
  refreshKey = 0,
  onSelectWorkArea,
  onPressReservations,
  onPressPayments,
  onPressProfile,
  onPressLogout,
  onPressSwitchAccount,
  onPressUserManagement,
  onPressChangePassword,
}: WorkAreasScreenProps) {
  const [selectedDate, setSelectedDate] = useState(
    () => initialAvailabilityContext?.date ?? getDeskDateOptions()[0].id,
  );
  const [startTime, setStartTime] = useState(
    () => initialAvailabilityContext?.startTime ?? '09:00',
  );
  const [endTime, setEndTime] = useState(
    () => initialAvailabilityContext?.endTime ?? '18:00',
  );
  const [localities, setLocalities] = useState<Locality[]>([]);
  const [areas, setAreas] = useState<WorkArea[]>([]);
  const [selectedLocalityId, setSelectedLocalityId] = useState<string | null>(null);
  const [expandedAreaId, setExpandedAreaId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTimeOptions, setShowTimeOptions] = useState(false);
  const requestIdRef = useRef(0);

  const quickDates = useMemo(() => getDeskDateOptions(new Date(), 30), []);
  const isCalendarDate = !quickDates
    .slice(0, 10)
    .some((date) => date.id === selectedDate);
  const calendarDateLabel = useMemo(() => {
    if (!isCalendarDate) return null;
    const date = new Date(`${selectedDate}T00:00:00`);

    return new Intl.DateTimeFormat('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(date);
  }, [isCalendarDate, selectedDate]);
  const endTimeOptions = timeOptions.filter(
    (time) => timeToMinutes(time) > timeToMinutes(startTime),
  );

  const loadAreas = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [localityItems, areaItems, availableAreaItems] = await Promise.all([
        listLocalities(),
        listWorkAreas(),
        listAvailableWorkAreas({ date: selectedDate, startTime, endTime }),
      ]);
      if (requestId !== requestIdRef.current) return;
      const availabilityByAreaId = new Map(
        availableAreaItems.map((area) => [area.id, area]),
      );
      const mergedAreas = areaItems.map((area) => {
        const availableArea = availabilityByAreaId.get(area.id);

        return {
          ...area,
          availableDeskCount: availableArea?.availableDeskCount ?? 0,
          totalDeskCount: availableArea?.totalDeskCount ?? 0,
        };
      });

      setLocalities(localityItems);
      setAreas(mergedAreas);
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      setLocalities([]);
      setAreas([]);
      setErrorMessage(getFriendlyErrorMessage(error));
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false);
    }
  }, [endTime, selectedDate, startTime]);

  useEffect(() => {
    void loadAreas();
    return () => {
      requestIdRef.current += 1;
    };
  }, [loadAreas, refreshKey]);

  const pullToRefresh = usePullToRefresh(loadAreas);

  const visibleLocalities = selectedLocalityId
    ? localities.filter((locality) => locality.id === selectedLocalityId)
    : localities;
  const visibleAreas = selectedLocalityId
    ? areas.filter((area) => area.localityId === selectedLocalityId)
    : areas;
  const groupedLocalities = visibleLocalities.map((locality) => ({
    locality,
    areas: visibleAreas.filter((area) => area.localityId === locality.id),
  }));
  const totalAvailableAreas = visibleAreas.filter(
    (area) => (area.availableDeskCount ?? 0) > 0,
  ).length;

  const handleToggleArea = (areaId: string) => {
    setExpandedAreaId((current) => (current === areaId ? null : areaId));
  };

  const handleReserveArea = (area: WorkArea) => {
    onSelectWorkArea(area, {
      date: selectedDate,
      startTime,
      endTime,
    });
  };

  const handleSelectLocality = (localityId: string | null) => {
    setSelectedLocalityId(localityId);
    setExpandedAreaId(null);
  };

  return (
    <ScreenContainer>
      <View style={styles.layout}>
        <ScrollView
          testID="work-areas-scroll"
          refreshControl={
            <RefreshControl
              colors={[colors.primary]}
              onRefresh={() => void pullToRefresh.onRefresh()}
              refreshing={pullToRefresh.isRefreshing}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <View style={styles.header}>
            <AppText variant="title">Areas de Trabajo</AppText>
            <AppText variant="caption" color={colors.primaryLight} style={styles.headerMeta}>
              {totalAvailableAreas} areas con disponibilidad
            </AppText>
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
                Ver mas fechas
              </AppText>
            </Pressable>
          )}

          <Pressable
            accessibilityRole="button"
            onPress={() => setShowTimeOptions((current) => !current)}
            style={({ pressed }) => [styles.timeSummary, pressed && styles.pressed]}
          >
            <Icon name="clock" size={16} color={colors.primaryLight} />
            <AppText variant="caption" color={colors.primary} style={styles.timeSummaryText}>
              {startTime} a {endTime}
            </AppText>
            <Icon name="chevronDown" size={16} color={colors.primaryLight} />
          </Pressable>

          {showTimeOptions ? (
            <View style={styles.timePanel}>
              <View style={styles.timeColumn}>
                <AppText variant="caption" color={colors.blackOverlay} style={styles.timeLabel}>
                  Desde
                </AppText>
                <View style={styles.timeChips}>
                  {timeOptions.slice(0, -1).map((time) => (
                    <Pressable
                      key={time}
                      accessibilityRole="button"
                      onPress={() => {
                        setStartTime(time);
                        if (timeToMinutes(endTime) <= timeToMinutes(time)) {
                          const nextEndTime = timeOptions.find(
                            (option) => timeToMinutes(option) > timeToMinutes(time),
                          );
                          setEndTime(nextEndTime ?? '20:00');
                        }
                      }}
                      style={({ pressed }) => [
                        styles.timeChip,
                        startTime === time && styles.timeChipSelected,
                        pressed && styles.pressed,
                      ]}
                    >
                      <AppText
                        variant="caption"
                        color={startTime === time ? colors.white : colors.primary}
                        style={styles.timeChipText}
                      >
                        {time}
                      </AppText>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.timeColumn}>
                <AppText variant="caption" color={colors.blackOverlay} style={styles.timeLabel}>
                  Hasta
                </AppText>
                <View style={styles.timeChips}>
                  {endTimeOptions.map((time) => (
                    <Pressable
                      key={time}
                      accessibilityRole="button"
                      onPress={() => setEndTime(time)}
                      style={({ pressed }) => [
                        styles.timeChip,
                        endTime === time && styles.timeChipSelected,
                        pressed && styles.pressed,
                      ]}
                    >
                      <AppText
                        variant="caption"
                        color={endTime === time ? colors.white : colors.primary}
                        style={styles.timeChipText}
                      >
                        {time}
                      </AppText>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
          ) : null}

          <View style={styles.localityFilterSection}>
            <AppText variant="caption" color={colors.blackOverlay} style={styles.timeLabel}>
              Filtrar por localidad
            </AppText>
            <LocalityFilter
              localities={localities}
              selectedLocalityId={selectedLocalityId}
              onSelect={handleSelectLocality}
            />
          </View>

          <View style={styles.separator} />

          {isLoading ? (
            <DesksFeedbackCard
              icon="loader"
              title="Cargando areas"
              description="Estamos consultando las areas disponibles para la fecha seleccionada."
            />
          ) : errorMessage ? (
            <DesksFeedbackCard
              icon="circleAlert"
              title="Lo sentimos, no pudimos recuperar las areas"
              description={errorMessage}
            />
          ) : localities.length === 0 ? (
            <DesksFeedbackCard
              icon="mapPin"
              title="No hay localidades disponibles"
              description="Cuando haya localidades activas, se mostraran en esta seccion."
            />
          ) : areas.length === 0 ? (
            <DesksFeedbackCard
              icon="search"
              title="No hay areas disponibles"
              description="No encontramos areas de trabajo activas para mostrar."
            />
          ) : (
            <View style={styles.sections}>
              {groupedLocalities.map(({ locality, areas: localityAreas }) => (
                <LocalitySection
                  key={locality.id}
                  locality={locality}
                  areas={localityAreas}
                  expandedAreaId={expandedAreaId}
                  onToggleArea={handleToggleArea}
                  onReserveArea={handleReserveArea}
                />
              ))}
            </View>
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
        />
      </View>

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
    paddingBottom: spacing.md,
  },
  header: {
    gap: spacing.xs,
  },
  headerMeta: {
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.75,
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
  timeSummary: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 36,
    paddingHorizontal: spacing.md,
  },
  timeSummaryText: {
    fontWeight: '800',
  },
  timePanel: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  timeColumn: {
    gap: spacing.sm,
  },
  timeLabel: {
    fontWeight: '700',
  },
  timeChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  timeChip: {
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    minHeight: 34,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  timeChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  timeChipText: {
    fontWeight: '800',
  },
  localityFilterSection: {
    gap: spacing.sm,
  },
  separator: {
    backgroundColor: colors.border,
    height: 1,
  },
  sections: {
    gap: spacing.xl,
  },
});
