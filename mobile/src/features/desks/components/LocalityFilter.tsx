import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { AppText } from '../../../components/ui/AppText';
import { colors } from '../../../theme/colors';
import { radii, spacing } from '../../../theme/spacing';
import type { Locality } from '../types/desk.types';

type LocalityFilterProps = {
  localities: Locality[];
  selectedLocalityId: string | null;
  onSelect: (localityId: string | null) => void;
};

export function LocalityFilter({
  localities,
  selectedLocalityId,
  onSelect,
}: LocalityFilterProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Mostrar todas las localidades"
        accessibilityState={{ selected: selectedLocalityId === null }}
        onPress={() => onSelect(null)}
        style={({ pressed }) => [
          styles.option,
          selectedLocalityId === null && styles.optionSelected,
          pressed && styles.pressed,
        ]}
      >
        <AppText
          variant="caption"
          color={selectedLocalityId === null ? colors.white : colors.primary}
          style={styles.label}
        >
          Todas
        </AppText>
      </Pressable>

      {localities.map((locality) => {
        const selected = locality.id === selectedLocalityId;

        return (
          <Pressable
            key={locality.id}
            accessibilityRole="button"
            accessibilityLabel={`Filtrar por ${locality.name}`}
            accessibilityState={{ selected }}
            onPress={() => onSelect(locality.id)}
            style={({ pressed }) => [
              styles.option,
              selected && styles.optionSelected,
              pressed && styles.pressed,
            ]}
          >
            <AppText
              variant="caption"
              color={selected ? colors.white : colors.primary}
              style={styles.label}
            >
              {locality.name}
            </AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.sm,
  },
  option: {
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 36,
    paddingHorizontal: spacing.md,
  },
  optionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  label: {
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.75,
  },
});
