import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '../../../components/ui/AppText';
import { BottomTabBar } from '../../../components/ui/BottomTabBar';
import { Button } from '../../../components/ui/Button';
import { ConfirmModal } from '../../../components/ui/ConfirmModal';
import { Input } from '../../../components/ui/Input';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { StatusModal } from '../../../components/ui/StatusModal';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { DesksFeedbackCard } from '../../desks/components/DesksFeedbackCard';
import { UserRole } from '../../auth/types/auth.types';
import { ManagedUserCard } from '../components/ManagedUserCard';
import { useUserManagement } from '../hooks/useUserManagement';
import { ManagedUser } from '../types/managed-user.types';

type UserManagementScreenProps = {
  accessToken: string;
  currentUserId: string;
  onPressDesks: () => void;
  onPressReservations: () => void;
  onPressPayments: () => void;
  onPressProfile: () => void;
  onPressLogout: () => void;
  onPressSwitchAccount: () => void;
  onPressUserManagement: () => void;
  onPressAdminCatalog: () => void;
  onPressChangePassword?: () => void;
};

type ActionFeedback = { type: 'loading' | 'success' | 'error'; title: string; description: string };

export function UserManagementScreen(props: UserManagementScreenProps) {
  const management = useUserManagement(props.accessToken);
  const [searchInput, setSearchInput] = useState('');
  const [userToDeactivate, setUserToDeactivate] = useState<ManagedUser | null>(null);
  const [userToRestore, setUserToRestore] = useState<ManagedUser | null>(null);
  const [feedback, setFeedback] = useState<ActionFeedback | null>(null);

  const handleSaveRole = async (user: ManagedUser, role: UserRole) => {
    setFeedback({ type: 'loading', title: 'Actualizando rol...', description: 'Estamos guardando los permisos del usuario.' });
    try {
      await management.changeRole(user.id, role);
      setFeedback({ type: 'success', title: 'Rol actualizado', description: 'Los permisos del usuario se actualizaron correctamente.' });
    } catch (error) {
      setFeedback({ type: 'error', title: 'No pudimos actualizar el rol', description: error instanceof Error ? error.message : 'Intente nuevamente.' });
    }
  };

  const handleDeactivate = async () => {
    if (!userToDeactivate) return;
    const userId = userToDeactivate.id;
    setUserToDeactivate(null);
    setFeedback({ type: 'loading', title: 'Desactivando usuario...', description: 'Estamos aplicando la baja logica.' });
    try {
      await management.deactivate(userId);
      setFeedback({ type: 'success', title: 'Usuario desactivado', description: 'La baja logica se aplico correctamente.' });
    } catch (error) {
      setFeedback({ type: 'error', title: 'No pudimos desactivar el usuario', description: error instanceof Error ? error.message : 'Intente nuevamente.' });
    }
  };

  const handleRestoreAccess = async () => {
    if (!userToRestore) return;
    const userId = userToRestore.id;
    setUserToRestore(null);
    setFeedback({ type: 'loading', title: 'Restaurando acceso...', description: 'Estamos habilitando nuevamente la cuenta.' });
    try {
      await management.restoreAccess(userId);
      setFeedback({ type: 'success', title: 'Acceso restaurado', description: 'El usuario puede volver a iniciar sesion.' });
    } catch (error) {
      setFeedback({ type: 'error', title: 'No pudimos restaurar el acceso', description: error instanceof Error ? error.message : 'Intente nuevamente.' });
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.layout}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.heading}>
            <AppText variant="title">Gestion de usuarios</AppText>
            <AppText variant="body" color={colors.primaryLight}>
              Administre roles y bajas logicas. Se muestran hasta 9 usuarios por pagina.
            </AppText>
          </View>

          <View style={styles.searchRow}>
            <Input
              label="Buscar usuario"
              placeholder="Nombre, usuario o email"
              value={searchInput}
              onChangeText={setSearchInput}
              onSubmitEditing={() => management.applySearch(searchInput)}
            />
            <Button title="Buscar" onPress={() => management.applySearch(searchInput)} />
          </View>

          {management.isLoading ? (
            <DesksFeedbackCard icon="loader" title="Cargando usuarios" description="Estamos recuperando las cuentas del sistema." />
          ) : management.errorMessage ? (
            <DesksFeedbackCard icon="circleAlert" title="Lo sentimos, no pudimos recuperar los usuarios" description={management.errorMessage} />
          ) : management.users.length === 0 ? (
            <DesksFeedbackCard icon="users" title="Sin usuarios" description="No encontramos usuarios para el criterio ingresado." />
          ) : (
            <View style={styles.list}>
              {management.users.map((user) => (
                <ManagedUserCard
                  key={user.id}
                  user={user}
                  isCurrentUser={user.id === props.currentUserId}
                  onSaveRole={(target, role) => void handleSaveRole(target, role)}
                  onDeactivate={setUserToDeactivate}
                  onRestoreAccess={setUserToRestore}
                />
              ))}
            </View>
          )}

          <View style={styles.pagination}>
            <Button title="Anterior" variant="ghost" onPress={management.previousPage} disabled={management.page <= 1} />
            <AppText variant="caption" color={colors.primaryLight}>Pagina {management.page} de {management.totalPages}</AppText>
            <Button title="Siguiente" variant="ghost" onPress={management.nextPage} disabled={management.page >= management.totalPages} />
          </View>
        </ScrollView>

        <BottomTabBar
          activeTab="users"
          userRole="ADMIN"
          onPressDesks={props.onPressDesks}
          onPressReservations={props.onPressReservations}
          onPressPayments={props.onPressPayments}
          onPressProfile={props.onPressProfile}
          onPressLogout={props.onPressLogout}
          onPressSwitchAccount={props.onPressSwitchAccount}
          onPressUserManagement={props.onPressUserManagement}
          onPressAdminCatalog={props.onPressAdminCatalog}
          onPressChangePassword={props.onPressChangePassword}
        />
      </View>

      <ConfirmModal
        visible={userToDeactivate !== null}
        title="Desactivar usuario"
        description={userToDeactivate ? `La cuenta de ${userToDeactivate.member?.fullName ?? userToDeactivate.username} perdera acceso al sistema.` : undefined}
        confirmLabel="Si, desactivar"
        cancelLabel="Volver"
        destructive
        onConfirm={() => void handleDeactivate()}
        onCancel={() => setUserToDeactivate(null)}
      />

      <ConfirmModal
        visible={userToRestore !== null}
        title="Restaurar acceso"
        description={userToRestore ? `La cuenta de ${userToRestore.member?.fullName ?? userToRestore.username} recuperara el acceso al sistema.` : undefined}
        confirmLabel="Restaurar"
        cancelLabel="Volver"
        onConfirm={() => void handleRestoreAccess()}
        onCancel={() => setUserToRestore(null)}
      />

      {feedback ? (
        <StatusModal
          visible
          type={feedback.type}
          title={feedback.title}
          description={feedback.description}
          onClose={feedback.type === 'loading' ? undefined : () => setFeedback(null)}
        />
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  layout: { flex: 1, gap: spacing.md },
  content: { gap: spacing.xl, paddingBottom: spacing.md },
  heading: { gap: spacing.xs },
  searchRow: { alignItems: 'flex-end', flexDirection: 'row', gap: spacing.md },
  list: { gap: spacing.md },
  pagination: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
});
