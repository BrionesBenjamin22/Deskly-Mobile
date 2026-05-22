import { StyleSheet, View } from 'react-native';

import { Badge } from '../../../components/ui/Badge';
import { spacing } from '../../../theme/spacing';
import { DeskAmenity } from '../types/desk.types';

export type DeskAmenitiesProps = {
  amenities: DeskAmenity[];
  visibleCount?: number;
};

export function DeskAmenities({
  amenities,
  visibleCount = 3,
}: DeskAmenitiesProps) {
  const visibleAmenities = amenities.slice(0, visibleCount);
  const hiddenCount = Math.max(amenities.length - visibleCount, 0);

  return (
    <View style={styles.container}>
      {visibleAmenities.map((amenity) => (
        <Badge key={amenity.id} label={amenity.name} />
      ))}
      {hiddenCount > 0 ? <Badge label={`+${hiddenCount} más`} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
});
