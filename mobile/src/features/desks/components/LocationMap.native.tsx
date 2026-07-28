import { StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { AppText } from '../../../components/ui/AppText';
import { colors } from '../../../theme/colors';
import { radii, spacing } from '../../../theme/spacing';

export type LocationMapProps = {
  latitude?: number | null;
  longitude?: number | null;
  title: string;
  description?: string | null;
};

export function hasValidCoordinates(latitude?: number | null, longitude?: number | null) {
  return Number.isFinite(latitude) && Number.isFinite(longitude) &&
    latitude! >= -90 && latitude! <= 90 && longitude! >= -180 && longitude! <= 180;
}

export function LocationMap({ latitude, longitude, title, description }: LocationMapProps) {
  if (!hasValidCoordinates(latitude, longitude)) return null;

  const coordinate = { latitude: latitude!, longitude: longitude! };

  return (
    <View style={styles.container}>
      <AppText variant="caption" color={colors.primaryLight}>Ubicación en el mapa</AppText>
      <View style={styles.mapFrame}>
        <MapView
          accessibilityLabel={`Mapa de ${title}`}
          initialRegion={{ ...coordinate, latitudeDelta: 0.012, longitudeDelta: 0.012 }}
          loadingEnabled
          pitchEnabled={false}
          rotateEnabled={false}
          showsCompass={false}
          showsMyLocationButton={false}
          showsUserLocation={false}
          style={styles.map}
          toolbarEnabled={false}
        >
          <Marker coordinate={coordinate} description={description ?? undefined} title={title} />
        </MapView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  mapFrame: {
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    height: 160,
    overflow: 'hidden',
  },
  map: { flex: 1 },
});
