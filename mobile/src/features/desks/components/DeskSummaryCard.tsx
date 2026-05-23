import { StyleSheet, View } from 'react-native';

import { AppText } from '../../../components/ui/AppText';
import { Card } from '../../../components/ui/Card';
import { Icon } from '../../../components/ui/Icon';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { Desk } from '../types/desk.types';
import { DeskAmenities } from './DeskAmenities';

type DeskSummaryCardProps = {
  desk: Desk;
};

function getDeskTitle(desk: Desk) {
  return desk.name ?? `Escritorio ${desk.code}`;
}

function getLocationText(desk: Desk) {
  const zone = desk.zone ? `Zona ${desk.zone}` : 'Zona sin asignar';
  const location = desk.description?.description ?? desk.description?.name;

  return location ? `${zone} - ${location}` : zone;
}

export function DeskSummaryCard({ desk }: DeskSummaryCardProps) {
  const capacity = desk.peopleCapacity;
  const peopleText = capacity === 1 ? 'persona' : 'personas';

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <AppText variant="subtitle" style={styles.title}>
            {getDeskTitle(desk)}
          </AppText>
          <View style={styles.metaRow}>
            <Icon name="mapPin" size={15} color={colors.primaryLight} />
            <AppText variant="caption" color={colors.blackOverlay}>
              {getLocationText(desk)}
            </AppText>
          </View>
        </View>
        <View style={styles.metaRow}>
          <Icon name="users" size={16} color={colors.primaryLight} />
          <AppText variant="caption" color={colors.primary} style={styles.capacity}>
            {capacity} {peopleText}
          </AppText>
        </View>
      </View>

      <DeskAmenities amenities={desk.amenities} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  titleBlock: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    fontWeight: '700',
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  capacity: {
    fontWeight: '700',
  },
});
