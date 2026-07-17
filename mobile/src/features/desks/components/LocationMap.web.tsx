import { createElement } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '../../../components/ui/AppText';
import { colors } from '../../../theme/colors';
import { radii, spacing } from '../../../theme/spacing';
import type { LocationMapProps } from './LocationMap.native';

function hasValidCoordinates(latitude?: number | null, longitude?: number | null) {
  return Number.isFinite(latitude) && Number.isFinite(longitude) &&
    latitude! >= -90 && latitude! <= 90 && longitude! >= -180 && longitude! <= 180;
}

export function LocationMap({ latitude, longitude, title }: LocationMapProps) {
  if (!hasValidCoordinates(latitude, longitude)) return null;

  const lat = latitude!;
  const lon = longitude!;
  const delta = 0.006;
  const bbox = [lon - delta, lat - delta, lon + delta, lat + delta].join(',');
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${encodeURIComponent(`${lat},${lon}`)}`;

  return (
    <View style={styles.container}>
      <AppText variant="caption" color={colors.primaryLight}>Ubicación en el mapa</AppText>
      <View style={styles.mapFrame}>
        {createElement('iframe', {
          'aria-label': `Mapa de ${title}`,
          loading: 'lazy',
          src,
          style: styles.iframe,
          title: `Mapa de ${title}`,
        })}
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
  iframe: {
    borderWidth: 0,
    height: '100%',
    width: '100%',
  },
});
