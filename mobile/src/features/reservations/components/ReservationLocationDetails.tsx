import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../../../components/ui/AppText';
import { Icon } from '../../../components/ui/Icon';
import { colors } from '../../../theme/colors';
import { radii, spacing } from '../../../theme/spacing';
import { LocationMap } from '../../desks/components/LocationMap';
import type { ReservationLocation } from '../types/reservation.types';

type ReservationLocationDetailsProps = {
  location: ReservationLocation;
  expanded: boolean;
  onToggle: () => void;
};

export function ReservationLocationDetails({ location, expanded, onToggle }: ReservationLocationDetailsProps) {
  const showCoordinates = Number.isFinite(location.latitude) && Number.isFinite(location.longitude);

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityLabel={expanded ? 'Ocultar detalles de ubicación' : 'Ver detalles de ubicación'}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={onToggle}
        style={({ pressed }) => [styles.toggle, pressed && styles.pressed]}
      >
        <View style={styles.label}>
          <Icon name="mapPin" size={16} />
          <AppText variant="caption" color={colors.primary} style={styles.strong}>
            {expanded ? 'Ocultar detalles' : 'Ver detalles'}
          </AppText>
        </View>
        <Icon name={expanded ? 'chevronDown' : 'chevronRight'} size={16} />
      </Pressable>

      {expanded ? (
        <View style={styles.details}>
          <Detail label="Área de trabajo" value={location.areaName} />
          <Detail label="Localidad" value={location.localityName} />
          {location.address ? <Detail label="Dirección" value={location.address} /> : null}
          {showCoordinates ? (
            <Detail
              label="Coordenadas"
              value={`${location.latitude}, ${location.longitude}`}
            />
          ) : null}
          <LocationMap
            latitude={location.latitude}
            longitude={location.longitude}
            title={location.areaName}
            description={location.address ?? location.localityName}
          />
        </View>
      ) : null}
    </View>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <AppText variant="caption" color={colors.primaryLight}>{label}</AppText>
      <AppText variant="body" color={colors.primary} style={styles.strong}>{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  toggle: {
    alignItems: 'center', borderColor: colors.border, borderRadius: radii.md,
    borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between',
    minHeight: 44, paddingHorizontal: spacing.md,
  },
  pressed: { backgroundColor: colors.background },
  label: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  strong: { fontWeight: '800' },
  details: { backgroundColor: colors.background, borderRadius: radii.md, gap: spacing.md, padding: spacing.md },
  row: { gap: spacing.xs },
});
