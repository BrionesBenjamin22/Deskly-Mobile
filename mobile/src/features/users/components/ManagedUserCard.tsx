import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../../../components/ui/AppText';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { colors, statusColors } from '../../../theme/colors';
import { radii, spacing } from '../../../theme/spacing';
import { UserRole } from '../../auth/types/auth.types';
import { ManagedUser } from '../types/managed-user.types';
import { hasRoleChanged } from '../validation/managed-user.validation';

const roles: UserRole[] = ['ADMIN', 'GESTOR', 'MIEMBRO'];
const roleLabels: Record<UserRole, string> = {
  ADMIN: 'Administrador',
  GESTOR: 'Gestor',
  MIEMBRO: 'Miembro',
};

type ManagedUserCardProps = {
  user: ManagedUser;
  isCurrentUser: boolean;
  onSaveRole: (user: ManagedUser, role: UserRole) => void;
  onDeactivate: (user: ManagedUser) => void;
};

export function ManagedUserCard({
  user,
  isCurrentUser,
  onSaveRole,
  onDeactivate,
}: ManagedUserCardProps) {
  const [selectedRole, setSelectedRole] = useState(user.role);

  useEffect(() => setSelectedRole(user.role), [user.role]);
  const canEdit = user.active && !isCurrentUser;

  return (
    <Card style={[styles.card, !user.active && styles.inactiveCard]}>
      <View style={styles.header}>
        <View style={styles.identity}>
          <AppText variant="subtitle" style={styles.name}>
            {user.member?.fullName ?? user.username}
          </AppText>
          <AppText variant="caption" color={colors.primaryLight}>
            @{user.username} · {user.email}
          </AppText>
        </View>
        <View style={[styles.status, user.active ? styles.active : styles.inactive]}>
          <AppText
            variant="caption"
            color={user.active ? statusColors.success : statusColors.error}
            style={styles.statusText}
          >
            {user.active ? 'Activo' : 'Inactivo'}
          </AppText>
        </View>
      </View>

      <View style={styles.roles}>
        {roles.map((role) => {
          const selected = role === selectedRole;
          return (
            <Pressable
              key={role}
              accessibilityRole="button"
              disabled={!canEdit}
              onPress={() => setSelectedRole(role)}
              style={[styles.roleChip, selected && styles.roleChipSelected, !canEdit && styles.disabled]}
            >
              <AppText variant="caption" color={selected ? colors.white : colors.primary}>
                {roleLabels[role]}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      {isCurrentUser ? (
        <AppText variant="caption" color={colors.primaryLight}>
          Su propia cuenta no puede modificarse desde esta pantalla.
        </AppText>
      ) : null}

      <View style={styles.actions}>
        <Button
          title="Guardar"
          onPress={() => onSaveRole(user, selectedRole)}
          disabled={!canEdit || !hasRoleChanged(user.role, selectedRole)}
        />
        <Pressable
          accessibilityRole="button"
          disabled={!canEdit}
          onPress={() => onDeactivate(user)}
          style={[styles.deactivateButton, !canEdit && styles.disabled]}
        >
          <AppText variant="caption" color={statusColors.error} style={styles.deactivateText}>
            Desactivar usuario
          </AppText>
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  inactiveCard: { opacity: 0.72 },
  header: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.md, justifyContent: 'space-between' },
  identity: { flex: 1, gap: spacing.xs },
  name: { fontWeight: '800' },
  status: { borderRadius: radii.pill, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  active: { backgroundColor: statusColors.successSoft },
  inactive: { backgroundColor: statusColors.errorSoft },
  statusText: { fontWeight: '800' },
  roles: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  roleChip: { borderColor: colors.border, borderRadius: radii.pill, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  roleChipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  actions: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, justifyContent: 'space-between' },
  deactivateButton: { minHeight: 42, justifyContent: 'center', paddingHorizontal: spacing.md },
  deactivateText: { fontWeight: '800' },
  disabled: { opacity: 0.45 },
});
