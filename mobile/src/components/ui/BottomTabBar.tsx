import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { colors } from '../../theme/colors';
import { radii, spacing } from '../../theme/spacing';
import { AppText } from './AppText';
import { Icon, IconName } from './Icon';
import { UserRole } from '../../features/auth/types/auth.types';

type BottomTab =
  | 'desks'
  | 'reservations'
  | 'payments'
  | 'settings'
  | 'users'
  | 'profile';

export type BottomTabBarProps = {
  activeTab: BottomTab;
  onPressDesks?: () => void;
  onPressReservations?: () => void;
  onPressPayments?: () => void;
  onPressSettings?: () => void;
  onPressProfile?: () => void;
  onPressLogout?: () => void;
  onPressSwitchAccount?: () => void;
  onPressUserManagement?: () => void;
  onPressChangePassword?: () => void;
  userRole?: UserRole;
};

const tabs: { key: BottomTab; label: string; icon: IconName }[] = [
  { key: 'desks', label: 'Escritorios', icon: 'home' },
  { key: 'reservations', label: 'Mis reservas', icon: 'calendar' },
  { key: 'payments', label: 'Pagos', icon: 'wallet' },
  { key: 'users', label: 'Gestión de usuarios', icon: 'users' },
  // Configuracion existe como flujo interno, pero no se expone en la barra inferior por decision de producto.
  //{ key: 'settings', label: 'Configuracion', icon: 'user' },
  { key: 'profile', label: 'Cuenta', icon: 'user' },
];

export function BottomTabBar({
  activeTab,
  onPressDesks,
  onPressReservations,
  onPressProfile,
  onPressLogout,
  onPressSwitchAccount,
  onPressPayments,
  onPressSettings,
  onPressUserManagement,
  onPressChangePassword,
  userRole,
}: BottomTabBarProps) {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const handlers = {
    desks: onPressDesks,
    reservations: onPressReservations,
    payments: onPressPayments,
    settings: onPressSettings,
    users: onPressUserManagement,
    profile: onPressProfile,
  };
  const visibleTabs =
    userRole === 'GESTOR'
      ? tabs.filter((tab) => tab.key === 'reservations' || tab.key === 'profile')
      : userRole === 'ADMIN'
        ? tabs.filter((tab) => tab.key === 'users' || tab.key === 'profile')
        : tabs;

  const runProfileAction = (action?: () => void) => {
    setIsProfileMenuOpen(false);
    action?.();
  };

  return (
    <>
      <Modal
        animationType="fade"
        onRequestClose={() => setIsProfileMenuOpen(false)}
        transparent
        visible={isProfileMenuOpen}
      >
        <View style={styles.menuOverlay}>
          <Pressable
            accessibilityLabel="Cerrar menú de cuenta"
            accessibilityRole="button"
            onPress={() => setIsProfileMenuOpen(false)}
            style={StyleSheet.absoluteFillObject}
            testID="bottom-tab-menu-backdrop"
          />
          <View style={styles.profileMenu}>
            <ProfileMenuItem
              icon="user"
              label="Mi perfil"
              onPress={() => runProfileAction(onPressProfile)}
            />
            <ProfileMenuItem
              icon="pencil"
              label="Cambiar contraseña"
              onPress={() => runProfileAction(onPressChangePassword)}
            />
            <ProfileMenuItem
              icon="users"
              label="Cambiar cuenta"
              onPress={() => runProfileAction(onPressSwitchAccount)}
            />
            <ProfileMenuItem
              icon="logout"
              label="Cerrar sesión"
              onPress={() => runProfileAction(onPressLogout)}
            />
          </View>
        </View>
      </Modal>

      <View style={styles.container}>
        {visibleTabs.map((tab) => {
          const isActive = tab.key === activeTab;
          const tint = isActive ? colors.primary : colors.primaryLight;

          return (
            <Pressable
              key={tab.key}
              accessibilityRole="button"
              accessibilityState={{
                expanded: tab.key === 'profile' ? isProfileMenuOpen : undefined,
              }}
              onPress={() => {
                if (tab.key === 'profile') {
                  setIsProfileMenuOpen((current) => !current);
                  return;
                }

                setIsProfileMenuOpen(false);
                handlers[tab.key]?.();
              }}
              style={({ pressed }) => [styles.item, pressed && styles.pressed]}
            >
              <Icon name={tab.icon} color={tint} size={20} />
              <AppText
                variant="caption"
                color={tint}
                numberOfLines={1}
                style={isActive ? styles.activeLabel : undefined}
              >
                {userRole === 'GESTOR' && tab.key === 'reservations'
                  ? 'Reservas'
                  : tab.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </>
  );
}

type ProfileMenuItemProps = {
  icon: IconName;
  label: string;
  onPress: () => void;
};

function ProfileMenuItem({ icon, label, onPress }: ProfileMenuItemProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.profileMenuItem,
        pressed && styles.pressed,
      ]}
    >
      <Icon name={icon} color={colors.primary} size={18} />
      <AppText
        variant="caption"
        color={colors.primary}
        style={styles.menuLabel}
      >
        {label}
      </AppText>
    </Pressable>
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
    position: 'relative',
    zIndex: 20,
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
  menuOverlay: {
    flex: 1,
  },
  profileMenu: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    bottom: 76,
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.12)',
    elevation: 12,
    minWidth: 190,
    overflow: 'hidden',
    position: 'absolute',
    right: spacing.screenX,
  },
  profileMenuItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 44,
    paddingHorizontal: spacing.md,
  },
  menuLabel: {
    fontWeight: '700',
  },
});
