import { Pressable, StyleSheet, View } from 'react-native';

import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { AppText } from './AppText';
import { Icon, IconName } from './Icon';

type BottomTab = 'desks' | 'reservations' | 'settings';

export type BottomTabBarProps = {
  activeTab: BottomTab;
  onPressDesks?: () => void;
  onPressReservations?: () => void;
  onPressSettings?: () => void;
  onPressLogout?: () => void;
};

const tabs: { key: BottomTab; label: string; icon: IconName }[] = [
  { key: 'desks', label: 'Escritorios', icon: 'home' },
  { key: 'reservations', label: 'Mis reservas', icon: 'calendar' },
  // Configuracion existe como flujo interno, pero no se expone en la barra inferior por decision de producto.
  //{ key: 'settings', label: 'Configuracion', icon: 'user' },
];

export function BottomTabBar({
  activeTab,
  onPressDesks,
  onPressReservations,
  onPressSettings,
}: BottomTabBarProps) {
  const handlers = {
    desks: onPressDesks,
    reservations: onPressReservations,
    settings: onPressSettings,
  };

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab;
        const tint = isActive ? colors.primary : colors.primaryLight;

        return (
          <Pressable
            key={tab.key}
            accessibilityRole="button"
            onPress={handlers[tab.key] ?? (() => console.log(tab.key))}
            style={({ pressed }) => [styles.item, pressed && styles.pressed]}
          >
            <Icon name={tab.icon} color={tint} size={20} />
            <AppText
              variant="caption"
              color={tint}
              numberOfLines={1}
              style={isActive ? styles.activeLabel : undefined}
            >
              {tab.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'space-between',
    marginHorizontal: -spacing.screenX,
    minHeight: 72,
    paddingHorizontal: spacing.screenX,
    paddingVertical: spacing.sm,
  },
  item: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.xs,
    justifyContent: 'center',
    minHeight: 48,
  },
  pressed: {
    opacity: 0.75,
  },
  activeLabel: {
    fontWeight: '700',
  },
});
